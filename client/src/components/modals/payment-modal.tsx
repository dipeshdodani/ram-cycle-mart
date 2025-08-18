import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentTransactionSchema, InsertPaymentTransaction, type PaymentTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, CreditCard, Banknote, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function PaymentModal({ isOpen, onClose, invoice }: PaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertPaymentTransactionSchema.omit({ invoiceId: true })),
    defaultValues: {
      amount: "",
      paymentMethod: "cash",
      transactionReference: "",
      notes: "",
    },
  });

  // Fetch payment transactions for this invoice
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/invoices", invoice?.id, "payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/invoices/${invoice.id}/payments`);
      return await res.json();
    },
    enabled: !!invoice?.id && isOpen,
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: Omit<InsertPaymentTransaction, "invoiceId">) => {
      const res = await apiRequest("POST", `/api/invoices/${invoice.id}/payments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoice.id, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Payment added",
        description: "Payment transaction has been recorded successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment",
        variant: "destructive",
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await apiRequest("DELETE", `/api/payments/${paymentId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoice.id, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Payment removed",
        description: "Payment transaction has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const processedData = {
      ...data,
      amount: parseFloat(data.amount),
    };
    addPaymentMutation.mutate(processedData);
  };

  const totalPaid = transactions.reduce((sum: number, payment: PaymentTransaction) => 
    sum + Number(payment.amount), 0
  );
  const totalAmount = Number(invoice?.total || 0);
  const remainingAmount = totalAmount - totalPaid;

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "card": return <CreditCard className="h-4 w-4" />;
      case "bank_transfer": return <Landmark className="h-4 w-4" />;
      case "upi": return <CreditCard className="h-4 w-4" />;
      default: return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentStatus = () => {
    if (remainingAmount <= 0) return "paid";
    if (totalPaid > 0) return "partial";
    return "pending";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case "partial":
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Partial</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Payment Management
            {getStatusBadge(getPaymentStatus())}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Paid Amount:</span>
                <span className="font-semibold text-green-600">₹{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Remaining:</span>
                <span className={`font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{remainingAmount.toFixed(2)}
                </span>
              </div>
              
              {/* Payment Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min((totalPaid / totalAmount) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-center text-gray-500">
                {((totalPaid / totalAmount) * 100).toFixed(1)}% paid
              </div>
            </CardContent>
          </Card>

          {/* Add New Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Add Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remainingAmount.toString()}
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transactionReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Transaction ID, Cheque No., etc." {...field} />
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
                            placeholder="Additional notes about this payment..."
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={addPaymentMutation.isPending || remainingAmount <= 0}
                    className="w-full"
                  >
                    {addPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Payment
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((payment: PaymentTransaction) => (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(payment.paymentMethod)}
                      <div>
                        <div className="font-semibold">₹{Number(payment.amount).toFixed(2)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {payment.paymentMethod.replace('_', ' ')}
                          {payment.transactionReference && ` • ${payment.transactionReference}`}
                        </div>
                        {payment.notes && (
                          <div className="text-xs text-gray-500 mt-1">{payment.notes}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePaymentMutation.mutate(payment.id)}
                      disabled={deletePaymentMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}