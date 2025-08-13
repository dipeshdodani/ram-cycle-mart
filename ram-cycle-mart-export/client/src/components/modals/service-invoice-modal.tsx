import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
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
import { Loader2, Calendar } from "lucide-react";

const serviceInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  workOrderId: z.string().optional(),
  subtotal: z.string().min(1, "Subtotal is required"),
  taxRate: z.string().default("0.18"),
  notes: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

type ServiceInvoiceFormData = z.infer<typeof serviceInvoiceSchema>;

interface ServiceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceInvoiceModal({ isOpen, onClose }: ServiceInvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ServiceInvoiceFormData>({
    resolver: zodResolver(serviceInvoiceSchema),
    defaultValues: {
      customerId: "",
      workOrderId: "",
      subtotal: "",
      taxRate: "0.18",
      notes: "",
      dueDate: "",
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      return res.json();
    },
  });

  const { data: workOrders } = useQuery({
    queryKey: ["/api/work-orders"],
    queryFn: async () => {
      const res = await fetch("/api/work-orders");
      return res.json();
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: ServiceInvoiceFormData) => {
      const subtotal = parseFloat(data.subtotal);
      const taxRate = parseFloat(data.taxRate);
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      const invoiceData = {
        ...data,
        type: "service",
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        dueDate: new Date(data.dueDate).toISOString(),
      };

      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Service invoice created",
        description: "Service invoice has been successfully created.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceInvoiceFormData) => {
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

  const subtotal = form.watch("subtotal");
  const taxRate = form.watch("taxRate");
  
  const calculateTotal = () => {
    const subtotalAmount = parseFloat(subtotal || "0");
    const rate = parseFloat(taxRate || "0");
    const taxAmount = subtotalAmount * rate;
    return {
      subtotal: subtotalAmount,
      tax: taxAmount,
      total: subtotalAmount + taxAmount
    };
  };

  const amounts = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Service Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for service work and repairs.
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
                name="workOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order (Optional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No work order</SelectItem>
                        {workOrders
                          ?.filter((wo: any) => wo.customerId === form.watch("customerId"))
                          ?.map((workOrder: any) => (
                            <SelectItem key={workOrder.id} value={workOrder.id}>
                              {workOrder.orderNumber} - {workOrder.problemDescription?.substring(0, 50)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date *</FormLabel>
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
                  <span>₹{amounts.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({(parseFloat(taxRate || "0") * 100).toFixed(1)}%):</span>
                  <span>₹{amounts.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-base border-t pt-2">
                  <span>Total:</span>
                  <span>₹{amounts.total.toFixed(2)}</span>
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
                Create Service Invoice
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}