import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, type InsertInvoice } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, CreditCard } from "lucide-react";
import { formatCurrency, INDIA_GST_RATE } from "@/lib/currency";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
}

export default function EnhancedInvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWarrantyYears, setSelectedWarrantyYears] = useState<number>(1);
  const [enablePartialPayment, setEnablePartialPayment] = useState<boolean>(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: workOrders } = useQuery({
    queryKey: ["/api/work-orders"],
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  // Check if this is a new sale invoice (has items field)
  const isNewSaleInvoice = invoice ? invoice.type === 'new_sale' : true;

  // Get today + 30 days for default due date
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      customerId: invoice?.customerId || "",
      workOrderId: invoice?.workOrderId || null,
      type: invoice?.type || (isNewSaleInvoice ? "new_sale" : "service"),
      subtotal: invoice?.subtotal || "0.00",
      taxRate: invoice?.taxRate || INDIA_GST_RATE.toString(),
      taxAmount: invoice?.taxAmount || "0.00",
      total: invoice?.total || "0.00",
      paidAmount: invoice?.paidAmount || "0.00",
      remainingAmount: invoice?.remainingAmount || "0.00",
      paymentStatus: invoice?.paymentStatus || "pending",
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(getDefaultDueDate()),
      notes: invoice?.notes || "",
      items: invoice?.items || "[]",
    },
  });

  // Watch form values for calculations
  const subtotal = form.watch("subtotal");
  const taxRate = form.watch("taxRate");
  const invoiceType = form.watch("type");

  // Auto-calculate tax and total when subtotal or tax rate changes
  const calculateTotals = () => {
    const subtotalNum = parseFloat(subtotal || "0") || 0;
    const taxRateNum = parseFloat(taxRate || "0") || 0;
    const taxAmount = subtotalNum * taxRateNum;
    const total = subtotalNum + taxAmount;
    
    form.setValue("taxAmount", taxAmount.toFixed(2));
    form.setValue("total", total.toFixed(2));

    // Handle partial payment calculations
    if (enablePartialPayment) {
      const paidAmount = parseFloat(partialPaymentAmount || "0");
      const remainingAmount = Math.max(0, total - paidAmount);
      
      form.setValue("paidAmount", paidAmount.toFixed(2));
      form.setValue("remainingAmount", remainingAmount.toFixed(2));
      
      if (paidAmount >= total) {
        form.setValue("paymentStatus", "paid");
      } else if (paidAmount > 0) {
        form.setValue("paymentStatus", "partial");
      } else {
        form.setValue("paymentStatus", "pending");
      }
    } else {
      form.setValue("paidAmount", "0.00");
      form.setValue("remainingAmount", total.toFixed(2));
      form.setValue("paymentStatus", "pending");
    }
  };

  // Calculate totals when values change
  React.useEffect(() => {
    calculateTotals();
  }, [subtotal, taxRate, enablePartialPayment, partialPaymentAmount]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // For new sales with warranty, update inventory items with warranty
      if (data.type === 'new_sale' && selectedWarrantyYears > 0) {
        try {
          const items = JSON.parse(data.items || "[]");
          for (const item of items) {
            if (item.inventoryItemId) {
              await apiRequest("PUT", `/api/inventory/${item.inventoryItemId}`, {
                warrantyPeriodYears: selectedWarrantyYears
              });
            }
          }
        } catch (error) {
          console.error("Error updating warranty periods:", error);
        }
      }

      const invoiceData = {
        ...data,
        invoiceNumber,
        dueDate: new Date(data.dueDate),
      };

      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      const invoice = await res.json();

      // Create payment transaction if partial payment is made
      if (enablePartialPayment && parseFloat(partialPaymentAmount || "0") > 0) {
        await apiRequest("POST", "/api/payment-transactions", {
          invoiceId: invoice.id,
          amount: parseFloat(partialPaymentAmount),
          paymentMethod: paymentMethod,
          notes: `Initial payment for ${invoiceNumber}`
        });
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Invoice created",
        description: "Invoice has been successfully created with warranty and payment details.",
      });
      onClose();
      form.reset();
      setSelectedWarrantyYears(1);
      setEnablePartialPayment(false);
      setPartialPaymentAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const invoiceData = {
        ...data,
        dueDate: new Date(data.dueDate),
      };
      const res = await apiRequest("PUT", `/api/invoices/${invoice.id}`, invoiceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Invoice updated",
        description: "Invoice has been successfully updated.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: InsertInvoice) => {
    if (invoice) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Calculate warranty display for existing invoice items
  const getWarrantyInfo = () => {
    if (!invoice || !invoice.items) return null;
    
    try {
      const items = JSON.parse(invoice.items);
      const itemsWithWarranty = items.filter((item: any) => {
        const inventoryItem = Array.isArray(inventory) ? 
          inventory.find((inv: any) => inv.id === item.inventoryItemId) : null;
        return inventoryItem?.warrantyPeriodYears > 0;
      });
      
      if (itemsWithWarranty.length > 0) {
        return (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Products with Warranty
              </span>
            </div>
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-300">
              {itemsWithWarranty.map((item: any, index: number) => {
                const inventoryItem = Array.isArray(inventory) ? 
                  inventory.find((inv: any) => inv.id === item.inventoryItemId) : null;
                return (
                  <div key={index}>
                    {item.name}: {inventoryItem?.warrantyPeriodYears || 0} year(s)
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error("Error parsing invoice items:", error);
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Edit Invoice" : "Create Invoice"}
          </DialogTitle>
          <DialogDescription>
            {invoice ? "Update invoice details below." : "Fill in the details to create a new invoice with warranty and payment options."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => {
                  const selectedCustomer = Array.isArray(customers) ? customers.find((c: any) => c.id === field.value) : null;
                  return (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Select customer"} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(customers) && customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.firstName} {customer.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Invoice Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoice type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="service">Service Invoice</SelectItem>
                        <SelectItem value="new_sale">New Sale Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Work Order Selection - Only for service invoices */}
            {invoiceType === "service" && (
              <FormField
                control={form.control}
                name="workOrderId"
                render={({ field }) => {
                  const selectedWorkOrder = Array.isArray(workOrders) ? workOrders.find((w: any) => w.id === field.value) : null;
                  return (
                    <FormItem>
                      <FormLabel>Work Order (Optional)</FormLabel>
                      <Select value={field.value || ""} onValueChange={(value) => field.onChange(value || null)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={selectedWorkOrder ? `${selectedWorkOrder.orderNumber} - ${selectedWorkOrder.problemDescription?.substring(0, 30)}...` : "Select work order"} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No work order</SelectItem>
                          {Array.isArray(workOrders) && workOrders?.map((workOrder: any) => (
                            <SelectItem key={workOrder.id} value={workOrder.id}>
                              {workOrder.orderNumber} - {workOrder.problemDescription.substring(0, 50)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {/* Product Warranty Section - Only for new sales and when not editing */}
            {invoiceType === "new_sale" && !invoice && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">Product Warranty</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((years) => (
                    <Button
                      key={years}
                      type="button"
                      variant={selectedWarrantyYears === years ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedWarrantyYears(years)}
                      className={selectedWarrantyYears === years ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      {years} Year{years > 1 ? 's' : ''}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                  Select warranty period for products in this sale
                </p>
              </div>
            )}

            {/* Show warranty info for existing invoices */}
            {invoice && getWarrantyInfo()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Subtotal */}
              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setTimeout(calculateTotals, 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tax Rate */}
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.18"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setTimeout(calculateTotals, 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tax Amount (calculated) */}
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        readOnly
                        {...field}
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total */}
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      readOnly
                      {...field}
                      className="bg-gray-50 dark:bg-gray-800 font-bold text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Partial Payment Section - Only when creating new invoice */}
            {!invoice && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="partial-payment"
                    checked={enablePartialPayment}
                    onCheckedChange={(checked) => setEnablePartialPayment(checked as boolean)}
                  />
                  <label htmlFor="partial-payment" className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    Accept Partial Payment
                  </label>
                </div>

                {enablePartialPayment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-800 dark:text-green-200">
                        Payment Amount (₹)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={partialPaymentAmount}
                        onChange={(e) => setPartialPaymentAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-800 dark:text-green-200">
                        Payment Method
                      </label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes for the invoice..."
                      {...field}
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {invoice ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}