import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Download, DollarSign, Clock, CheckCircle, Trash2, Edit } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", "service", searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "service");
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const url = `/api/invoices?${params.toString()}`;
      const res = await fetch(url);
      return res.json();
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData = { 
        paymentStatus: status,
        ...(status === 'paid' && { paymentDate: new Date() })
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
    try {
      console.log('Starting PDF generation for invoice:', invoice);
      // Import jsPDF dynamically to avoid SSR issues
      import('jspdf').then(({ default: jsPDF }) => {
        console.log('jsPDF imported successfully');
        import('jspdf-autotable').then(() => {
          console.log('jsPDF AutoTable imported successfully');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // Header with company info
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text('Ram Cycle Mart', pageWidth / 2, 25, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text('Cycle Service & Repair', pageWidth / 2, 35, { align: "center" });
        doc.text('Phone: +91 98765 43210 | Email: info@ramcyclemart.com', pageWidth / 2, 45, { align: "center" });
        
        // Horizontal line
        doc.setLineWidth(0.5);
        doc.line(20, 50, pageWidth - 20, 50);
        
        // Invoice title and details
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text('SERVICE INVOICE', 20, 65);
        
        // Invoice details section
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Left column - Invoice details
        doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 80);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 20, 87);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 20, 94);
        doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 20, 101);
        
        // Right column - Customer details
        doc.setFont("helvetica", "bold");
        doc.text('BILL TO:', pageWidth / 2 + 20, 80);
        doc.setFont("helvetica", "normal");
        doc.text(`${invoice.customer?.firstName} ${invoice.customer?.lastName}`, pageWidth / 2 + 20, 87);
        if (invoice.customer?.phone) {
          doc.text(`Phone: ${invoice.customer.phone}`, pageWidth / 2 + 20, 94);
        }
        if (invoice.customer?.email) {
          doc.text(`Email: ${invoice.customer.email}`, pageWidth / 2 + 20, 101);
        }
        
        // Service details table
        let startY = 115;
        const serviceData = [];
        
        if (invoice.workOrder) {
          serviceData.push(['Work Order', invoice.workOrder.orderNumber]);
          serviceData.push(['Problem Description', invoice.workOrder.problemDescription || 'N/A']);
          serviceData.push(['Service Type', 'Cycle Repair & Service']);
        } else {
          serviceData.push(['Service Type', 'General Service']);
          serviceData.push(['Description', 'Cycle Repair & Maintenance']);
        }
        
        (doc as any).autoTable({
          startY: startY,
          head: [['Service Details', 'Information']],
          body: serviceData,
          headStyles: {
            fillColor: [66, 135, 245],
            textColor: [255, 255, 255],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            cellPadding: 4
          },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 120 }
          },
          margin: { left: 20, right: 20 }
        });
        
        // Billing table
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        
        const billingData = [
          ['Service Charges', '', '', formatCurrency(parseFloat(invoice.subtotal))],
          ['GST (' + (parseFloat(invoice.taxRate) * 100).toFixed(1) + '%)', '', '', formatCurrency(parseFloat(invoice.taxAmount))]
        ];
        
        (doc as any).autoTable({
          startY: finalY,
          head: [['Description', 'Qty', 'Rate', 'Amount']],
          body: billingData,
          foot: [['', '', 'TOTAL AMOUNT:', formatCurrency(parseFloat(invoice.total))]],
          headStyles: {
            fillColor: [66, 135, 245],
            textColor: [255, 255, 255],
            fontSize: 11,
            fontStyle: 'bold'
          },
          footStyles: {
            fillColor: [245, 245, 245],
            textColor: [0, 0, 0],
            fontSize: 12,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            cellPadding: 4
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
        
        // Thank you message
        const footerY = (doc as any).lastAutoTable.finalY + 30;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text('Thank you for shopping with us!', pageWidth / 2, footerY, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text('We appreciate your business and look forward to serving you again.', pageWidth / 2, footerY + 10, { align: "center" });
        
        // Terms and conditions
        doc.setFontSize(8);
        doc.text('Terms: Payment is due within 30 days. Thank you for your business!', pageWidth / 2, footerY + 25, { align: "center" });
        
        console.log('About to save PDF with filename:', `service-invoice-${invoice.invoiceNumber}.pdf`);
        doc.save(`service-invoice-${invoice.invoiceNumber}.pdf`);
        console.log('PDF save completed');
      }).catch((error) => {
        console.error('Error importing jsPDF AutoTable:', error);
        toast({
          title: "PDF Generation Failed",
          description: "Failed to load PDF components. Please try again.",
          variant: "destructive",
        });
      });
    }).catch((error) => {
      console.error('Error importing jsPDF:', error);
      toast({
        title: "PDF Generation Failed", 
        description: "Failed to load PDF library. Please try again.",
        variant: "destructive",
      });
    });
    } catch (error) {
      console.error('Error in PDF generation:', error);
      toast({
        title: "PDF Generation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
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
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => window.location.href = '/work-orders'} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Work Order
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
                    onClick={() => setEditingInvoice(invoice)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
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
              <Button onClick={() => window.location.href = '/work-orders'}>
                <Plus className="h-4 w-4 mr-2" />
                Create Work Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ServiceInvoiceModal temporarily removed - functionality integrated into main component */}
    </div>
  );
}