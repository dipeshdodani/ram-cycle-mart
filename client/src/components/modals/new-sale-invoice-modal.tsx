import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const itemSchema = z.object({
  inventoryItemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
});

const newSaleInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  customerGstNumber: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  taxRate: z.string().default("0.18"),
  notes: z.string().optional(),
  dueDate: z.string().min(1, "Purchase date is required"),
});

type NewSaleInvoiceFormData = z.infer<typeof newSaleInvoiceSchema>;

interface NewSaleInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSaleInvoiceModal({ isOpen, onClose }: NewSaleInvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewSaleInvoiceFormData>({
    resolver: zodResolver(newSaleInvoiceSchema),
    defaultValues: {
      customerId: "",
      customerGstNumber: "",
      items: [{ inventoryItemId: "", quantity: 1, price: 0 }],
      taxRate: "0.18",
      notes: "",
      dueDate: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      return res.json();
    },
  });

  const { data: inventoryItems } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      return res.json();
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: NewSaleInvoiceFormData) => {
      // Validate inventory availability
      for (const item of data.items) {
        const inventoryItem = inventoryItems?.find((inv: any) => inv.id === item.inventoryItemId);
        if (!inventoryItem || inventoryItem.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${inventoryItem?.name || 'item'}. Available: ${inventoryItem?.quantity || 0}, Required: ${item.quantity}`);
        }
      }

      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const taxRate = parseFloat(data.taxRate);
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      const invoiceData = {
        customerId: data.customerId,
        customerGstNumber: data.customerGstNumber || null,
        type: "new_sale",
        items: JSON.stringify(data.items.map(item => {
          const inventoryItem = inventoryItems?.find((inv: any) => inv.id === item.inventoryItemId);
          return {
            inventoryItemId: item.inventoryItemId,
            name: inventoryItem?.name || '',
            quantity: item.quantity,
            price: item.price,
          };
        })),
        subtotal: subtotal.toString(),
        taxRate: data.taxRate,
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        notes: data.notes,
        dueDate: data.dueDate,
      };

      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "New sale invoice created",
        description: "Invoice created and inventory updated successfully.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create new sale invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewSaleInvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  // Set default due date to 30 days from now
  useEffect(() => {
    if (isOpen) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      form.setValue("dueDate", defaultDueDate.toISOString().split('T')[0]);
    }
  }, [isOpen, form]);

  // Auto-fill price when item is selected
  const handleItemSelect = (itemId: string, index: number) => {
    const item = inventoryItems?.find((inv: any) => inv.id === itemId);
    if (item) {
      form.setValue(`items.${index}.price`, parseFloat(item.price));
    }
  };

  const watchedItems = form.watch("items");
  const taxRate = form.watch("taxRate");
  
  const calculateTotal = () => {
    const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const rate = parseFloat(taxRate || "0");
    const taxAmount = subtotal * rate;
    return {
      subtotal,
      tax: taxAmount,
      total: subtotal + taxAmount
    };
  };

  const amounts = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sale Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for product sales. Inventory will be automatically updated.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerGstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer GST Number (Optional - B2B)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter GST number (e.g., 22AAAAA0000A1Z5)" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Rate</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select GST rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0% (Exempt)</SelectItem>
                        <SelectItem value="0.05">5%</SelectItem>
                        <SelectItem value="0.12">12%</SelectItem>
                        <SelectItem value="0.18">18%</SelectItem>
                        <SelectItem value="0.28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ inventoryItemId: "", quantity: 1, price: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`items.${index}.inventoryItemId`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Item *</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleItemSelect(value, index);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inventoryItems
                                ?.filter((item: any) => item.quantity > 0)
                                ?.map((item: any) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    <div className="flex items-center space-x-2">
                                      <span className="capitalize text-xs bg-gray-100 px-2 py-1 rounded">
                                        {item.type || 'Parts'}
                                      </span>
                                      <span>
                                        {item.brand && `${item.brand} - `}{item.name} (Stock: {item.quantity})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="block"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes or descriptions"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Amount Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(amounts.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({(parseFloat(taxRate || "0") * 100).toFixed(1)}%):</span>
                  <span>{formatCurrency(amounts.tax)}</span>
                </div>
                <div className="flex justify-between font-medium text-base border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(amounts.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create New Sale Invoice
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}