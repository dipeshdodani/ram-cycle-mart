import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Download, DollarSign, Clock, CheckCircle, Trash2 } from "lucide-react";
import ServiceInvoiceModal from "@/components/modals/service-invoice-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ServiceBilling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", "service", searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "service");
      if (statusFilter) params.append("status", statusFilter);
      
      const url = `/api/invoices?${params.toString()}`;
      const res = await fetch(url);
      return res.json();
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData = { 
        paymentStatus: status,
        ...(status === 'paid' && { paymentDate: new Date().toISOString() })
      };
      const res = await apiRequest("PUT", `/api/invoices/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service invoice updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update service invoice",
        variant: "destructive",
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await apiRequest("DELETE", `/api/invoices/${invoiceId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Service invoice deleted",
        description: "Service invoice has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      let errorMessage = "Failed to delete service invoice";
      if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices?.filter((invoice: any) =>
    invoice.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "pending": return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "overdue": return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default: return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "overdue": return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const generatePDF = (invoice: any) => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Ram Cycle Mart', 20, 20);
      doc.setFontSize(16);
      doc.text('Service Invoice', 20, 30);
      
      // Invoice details
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 50);
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 60);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 70);
      
      // Customer info
      doc.text('Bill To:', 20, 90);
      doc.text(`${invoice.customer?.firstName} ${invoice.customer?.lastName}`, 20, 100);
      if (invoice.customer?.phone) {
        doc.text(`Phone: ${invoice.customer.phone}`, 20, 110);
      }
      if (invoice.customer?.email) {
        doc.text(`Email: ${invoice.customer.email}`, 20, 120);
      }
      
      // Work order info if available
      if (invoice.workOrder) {
        doc.text('Service Details:', 20, 140);
        doc.text(`Work Order: ${invoice.workOrder.orderNumber}`, 20, 150);
        doc.text(`Problem: ${invoice.workOrder.problemDescription}`, 20, 160);
      }
      
      // Amounts
      doc.text(`Subtotal: ${formatCurrency(parseFloat(invoice.subtotal))}`, 20, 180);
      doc.text(`GST (${(parseFloat(invoice.taxRate) * 100).toFixed(1)}%): ${formatCurrency(parseFloat(invoice.taxAmount))}`, 20, 190);
      doc.setFontSize(14);
      doc.text(`Total: ${formatCurrency(parseFloat(invoice.total))}`, 20, 200);
      
      // Status
      doc.setFontSize(12);
      doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 20, 220);
      
      doc.save(`service-invoice-${invoice.invoiceNumber}.pdf`);
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading service invoices...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search service invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Service Invoice
        </Button>
      </div>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices.map((invoice: any) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                    <Badge className={getStatusColor(invoice.paymentStatus)}>
                      {getStatusIcon(invoice.paymentStatus)}
                      <span className="ml-1 capitalize">{invoice.paymentStatus}</span>
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {invoice.customer?.firstName} {invoice.customer?.lastName}
                      </p>
                      {invoice.customer?.phone && <p>{invoice.customer.phone}</p>}
                    </div>
                    <div>
                      <p>Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                      <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-lg text-green-600 dark:text-green-400">
                        {formatCurrency(parseFloat(invoice.total))}
                      </p>
                      {invoice.workOrder && (
                        <p className="text-xs">WO: {invoice.workOrder.orderNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePDF(invoice)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {invoice.paymentStatus !== 'paid' && (
                    <Select
                      value={invoice.paymentStatus}
                      onValueChange={(status) => updateInvoiceMutation.mutate({ id: invoice.id, status })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service Invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete invoice {invoice.invoiceNumber}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteInvoiceMutation.mutate(invoice.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInvoices.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No service invoices found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first service invoice.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Service Invoice
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ServiceInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}