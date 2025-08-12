import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Download, DollarSign, Clock, CheckCircle, Trash2, Edit, Wrench, AlertCircle } from "lucide-react";
import * as XLSX from 'xlsx';

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

  // Calculate service-specific metrics
  const serviceMetrics = invoices ? {
    totalServiceInvoices: invoices.length,
    totalServiceRevenue: invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0),
    pendingServices: invoices.filter((inv: any) => inv.paymentStatus === 'pending').length,
    completedServices: invoices.filter((inv: any) => inv.paymentStatus === 'paid').length,
    overdueServices: invoices.filter((inv: any) => {
      const dueDate = new Date(inv.dueDate);
      const today = new Date();
      return inv.paymentStatus === 'pending' && dueDate < today;
    }).length
  } : null;

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

  // Excel export function for service invoices
  const exportToExcel = () => {
    if (!invoices || invoices.length === 0) {
      toast({
        title: "No Data",
        description: "No service invoices to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = invoices.map((invoice: any) => ({
      'Invoice Number': invoice.invoiceNumber,
      'Customer Name': `${invoice.customer?.firstName || ''} ${invoice.customer?.lastName || ''}`.trim(),
      'Phone': invoice.customer?.phone || '',
      'Email': invoice.customer?.email || '',
      'Work Order ID': invoice.workOrderId || 'N/A',
      'Service Type': 'Service & Repair',
      'Subtotal (₹)': parseFloat(invoice.subtotal).toFixed(2),
      'Tax Rate (%)': (parseFloat(invoice.taxRate || 0) * 100).toFixed(1),
      'Tax Amount (₹)': parseFloat(invoice.taxAmount || 0).toFixed(2),
      'Total Amount (₹)': parseFloat(invoice.total).toFixed(2),
      'Payment Status': invoice.paymentStatus,
      'Payment Date': invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : '',
      'Due Date': new Date(invoice.dueDate).toLocaleDateString(),
      'Created Date': new Date(invoice.createdAt).toLocaleDateString(),
      'Notes': invoice.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Invoices');

    // Auto-fit columns
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; C++) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; R++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          maxWidth = Math.max(maxWidth, cell.v.toString().length);
        }
      }
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    worksheet['!cols'] = colWidths;

    const fileName = `Service_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Export Successful",
      description: `Service invoices exported to ${fileName}`,
    });
  };

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

  const generatePDF = async (invoice: any) => {
    try {
      console.log('Starting PDF generation for invoice:', invoice);
      
      // Import jsPDF and AutoTable properly
      const { default: jsPDF } = await import('jspdf');
      console.log('jsPDF imported successfully');
      
      // Import and apply AutoTable extension
      const autoTable = (await import('jspdf-autotable')).default;
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
        
        // Invoice title and details - dynamic based on invoice type
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        const invoiceTitle = invoice.type === 'new_sale' ? 'SALES INVOICE' : 'SERVICE INVOICE';
        doc.text(invoiceTitle, 20, 65);
        
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
        let customerYOffset = 94;
        if (invoice.customer?.phone) {
          doc.text(`Phone: ${invoice.customer.phone}`, pageWidth / 2 + 20, customerYOffset);
          customerYOffset += 7;
        }
        if (invoice.customer?.email) {
          doc.text(`Email: ${invoice.customer.email}`, pageWidth / 2 + 20, customerYOffset);
          customerYOffset += 7;
        }
        if (invoice.customer?.gstNumber) {
          doc.text(`GST No: ${invoice.customer.gstNumber}`, pageWidth / 2 + 20, customerYOffset);
        }
        
        // Details table - different content based on invoice type
        let startY = 115;
        let tableData = [];
        let tableHeaders = [];
        
        if (invoice.type === 'new_sale') {
          // For new sales, show the actual items sold
          const items = JSON.parse(invoice.items || '[]');
          tableHeaders = [['Item Description', 'Quantity', 'Unit Price', 'Total Amount']];
          tableData = items.map((item: any) => [
            item.name,
            item.quantity.toString(),
            formatCurrency(item.price),
            formatCurrency(item.quantity * item.price)
          ]);
        } else {
          // For service invoices, show service details
          tableHeaders = [['Service Details', 'Information']];
          if (invoice.workOrder) {
            tableData.push(['Work Order', invoice.workOrder.orderNumber]);
            tableData.push(['Problem Description', invoice.workOrder.problemDescription || 'N/A']);
            tableData.push(['Service Type', 'Cycle Repair & Service']);
          } else {
            tableData.push(['Service Type', 'General Service']);
            tableData.push(['Description', 'Cycle Repair & Maintenance']);
          }
        }
        
        autoTable(doc, {
          startY: startY,
          head: tableHeaders,
          body: tableData,
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
          columnStyles: invoice.type === 'new_sale' ? {
            0: { cellWidth: 60, halign: 'left' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 45, halign: 'right' },
            3: { cellWidth: 55, halign: 'right' }
          } : {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 120 }
          },
          margin: { left: 20, right: 20 }
        });
        
        // Billing summary table
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        
        const billingData = invoice.type === 'new_sale' ? [
          ['Subtotal', '', '', formatCurrency(parseFloat(invoice.subtotal))],
          ['GST (' + (parseFloat(invoice.taxRate) * 100).toFixed(1) + '%)', '', '', formatCurrency(parseFloat(invoice.taxAmount))]
        ] : [
          ['Service Charges', '', '', formatCurrency(parseFloat(invoice.subtotal))],
          ['GST (' + (parseFloat(invoice.taxRate) * 100).toFixed(1) + '%)', '', '', formatCurrency(parseFloat(invoice.taxAmount))]
        ];
        
        autoTable(doc, {
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
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 50, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
        
        // Thank you message - different for sales vs service
        const footerY = (doc as any).lastAutoTable.finalY + 30;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const thankYouMessage = invoice.type === 'new_sale' ? 
          'Thank you for shopping with us!' : 
          'Thank you for choosing our service!';
        doc.text(thankYouMessage, pageWidth / 2, footerY, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text('We appreciate your business and look forward to serving you again.', pageWidth / 2, footerY + 10, { align: "center" });
        
        // Terms and conditions
        doc.setFontSize(8);
        doc.text('Terms: Payment is due within 30 days. Thank you for your business!', pageWidth / 2, footerY + 25, { align: "center" });
        
      console.log('About to save PDF with filename:', `service-invoice-${invoice.invoiceNumber}.pdf`);
      doc.save(`service-invoice-${invoice.invoiceNumber}.pdf`);
      console.log('PDF save completed');
      
    } catch (error) {
      console.error('Error in PDF generation:', error);
      toast({
        title: "PDF Generation Failed",
        description: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading service invoices...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Service Metrics Dashboard Cards */}
      {serviceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Service Invoices</CardTitle>
              <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{serviceMetrics.totalServiceInvoices}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">All service invoices</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Service Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(serviceMetrics.totalServiceRevenue)}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Total earnings from services</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Services</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{serviceMetrics.pendingServices}</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Completed Services</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{serviceMetrics.completedServices}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Paid services</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Overdue Services</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{serviceMetrics.overdueServices}</div>
              <p className="text-xs text-red-600 dark:text-red-400">Past due date</p>
            </CardContent>
          </Card>
        </div>
      )}

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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => window.location.href = '/work-orders'} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Work Order
          </Button>
        </div>
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