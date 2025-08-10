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
import { Loader2 } from "lucide-react";
import { formatCurrency, INDIA_GST_RATE } from "@/lib/currency";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
}

export default function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: workOrders } = useQuery({
    queryKey: ["/api/work-orders"],
  });

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
      subtotal: invoice?.subtotal || "0.00",
      taxRate: invoice?.taxRate || INDIA_GST_RATE.toString(),
      taxAmount: invoice?.taxAmount || "0.00",
      total: invoice?.total || "0.00",
      paymentStatus: invoice?.paymentStatus || "pending",
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(getDefaultDueDate()),
      notes: invoice?.notes || "",
    },
  });

  // Watch subtotal and tax rate to calculate total
  const subtotal = form.watch("subtotal");
  const taxRate = form.watch("taxRate");

  // Auto-calculate tax and total when subtotal or tax rate changes
  const calculateTotals = () => {
    const subtotalNum = parseFloat(subtotal) || 0;
    const taxRateNum = parseFloat(taxRate) || 0;
    const taxAmount = subtotalNum * taxRateNum;
    const total = subtotalNum + taxAmount;
    
    form.setValue("taxAmount", taxAmount.toFixed(2));
    form.setValue("total", total.toFixed(2));
  };

  // Calculate totals when values change
  React.useEffect(() => {
    calculateTotals();
  }, [subtotal, taxRate]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceData = {
        ...data,
        invoiceNumber,
        dueDate: new Date(data.dueDate),
      };
      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Invoice created",
        description: "Invoice has been successfully created.",
      });
      onClose();
      form.reset();
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Edit Invoice" : "Create Invoice"}
          </DialogTitle>
          <DialogDescription>
            {invoice ? "Update invoice details below." : "Fill in the details to create a new invoice."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selection */}
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

              {/* Work Order Selection */}
              <FormField
                control={form.control}
                name="workOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order (Optional)</FormLabel>
                    <Select value={field.value || ""} onValueChange={(value) => field.onChange(value || null)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No work order</SelectItem>
                        {workOrders?.map((workOrder: any) => (
                          <SelectItem key={workOrder.id} value={workOrder.id}>
                            {workOrder.orderNumber} - {workOrder.problemDescription.substring(0, 50)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total (calculated) */}
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
                        className="bg-gray-50 font-bold text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Status */}
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
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
                      placeholder="Add any additional notes about this invoice..."
                      className="min-h-[80px]"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-primary-600 hover:bg-primary-700"
              >
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