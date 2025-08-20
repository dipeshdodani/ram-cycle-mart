import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ShoppingCart, Download, Settings, Trash2, Edit, DollarSign, Clock, CheckCircle, AlertCircle, Package } from "lucide-react";
import * as XLSX from 'xlsx';
import Pagination from "@/components/ui/pagination";
import EnhancedInvoiceModal from "@/components/modals/enhanced-invoice-modal";
import CompanySettingsModal from "@/components/modals/company-settings-modal";
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

export default function NewSaleBilling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["/api/invoices", "new_sale", searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "new_sale");
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const url = `/api/invoices?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: companySettings } = useQuery({
    queryKey: ["/api/company-settings"],
    queryFn: async () => {
      const res = await fetch("/api/company-settings");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    },
  });

  // Ensure invoices is always an array
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  // Filtered and paginated data
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice: any) => {
      const matchesSearch = !searchTerm || 
        invoice.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || invoice.paymentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Calculate new sale-specific metrics
  const salesMetrics = {
    totalSalesInvoices: invoices.length,
    totalSalesRevenue: invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0),
    pendingSales: invoices.filter((inv: any) => inv.paymentStatus === 'pending').length,
    completedSales: invoices.filter((inv: any) => inv.paymentStatus === 'paid').length,
    overdueSales: invoices.filter((inv: any) => {
      const dueDate = new Date(inv.dueDate);
      const today = new Date();
      return inv.paymentStatus === 'pending' && dueDate < today;
    }).length
  };

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
        description: "New sale invoice updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update new sale invoice",
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
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "New sale invoice deleted",
        description: "New sale invoice has been successfully deleted and inventory restored.",
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      let errorMessage = "Failed to delete new sale invoice";
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

  // Excel export function for new sale invoices
  const exportToExcel = () => {
    if (!invoices || invoices.length === 0) {
      toast({
        title: "No Data",
        description: "No new sale invoices to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = invoices.map((invoice: any) => {
      const items = JSON.parse(invoice.items || '[]');
      const itemsText = items.map((item: any) => 
        `${item.name} (Qty: ${item.quantity}, Price: ₹${item.price})`
      ).join('; ');

      return {
        'Invoice Number': invoice.invoiceNumber,
        'Customer Name': `${invoice.customer?.firstName || ''} ${invoice.customer?.lastName || ''}`.trim(),
        'Phone': invoice.customer?.phone || '',
        'Email': invoice.customer?.email || '',
        'Items Sold': itemsText,
        'Subtotal (₹)': parseFloat(invoice.subtotal).toFixed(2),
        'Tax Rate (%)': (parseFloat(invoice.taxRate || 0) * 100).toFixed(1),
        'Tax Amount (₹)': parseFloat(invoice.taxAmount || 0).toFixed(2),
        'Total Amount (₹)': parseFloat(invoice.total).toFixed(2),
        'Payment Status': invoice.paymentStatus,
        'Payment Date': invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : '',
        'Due Date': new Date(invoice.dueDate).toLocaleDateString(),
        'Created Date': new Date(invoice.createdAt).toLocaleDateString(),
        'Notes': invoice.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'New Sale Invoices');

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

    const fileName = `New_Sale_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Export Successful",
      description: `New sale invoices exported to ${fileName}`,
    });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "pending": return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "overdue": return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default: return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const generatePDF = async (invoice: any) => {
    try {
      console.log('Starting PDF generation for new sale invoice:', invoice);
      
      // Import jsPDF and AutoTable properly
      const { default: jsPDF } = await import('jspdf');
      console.log('jsPDF imported successfully');
      
      // Import and apply AutoTable extension
      const autoTable = (await import('jspdf-autotable')).default;
      console.log('jsPDF AutoTable imported successfully');
      
      const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // Professional header with company branding
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text(companySettings?.companyName || 'Ram Cycle Mart', pageWidth / 2, 25, { align: "center" });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text('Professional Cycle Service & Sales', pageWidth / 2, 35, { align: "center" });
        
        // Company details
        if (companySettings?.address) {
          doc.setFontSize(11);
          doc.text(companySettings.address, pageWidth / 2, 45, { align: "center" });
        }
        
        doc.setFontSize(11);
        doc.text('Phone: +91 98765 43210 | Email: info@ramcyclemart.com', pageWidth / 2, 52, { align: "center" });
        
        if (companySettings?.gstNumber) {
          doc.text(`GST Number: ${companySettings.gstNumber}`, pageWidth / 2, 59, { align: "center" });
        }
        
        // Decorative line
        doc.setLineWidth(0.8);
        doc.setDrawColor(66, 135, 245);
        doc.line(20, 65, pageWidth - 20, 65);
        
        // Invoice title
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(66, 135, 245);
        doc.text('NEW SALE INVOICE', 20, 80);
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
        
        // Invoice information section
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        // Left column - Invoice details
        doc.setFont("helvetica", "bold");
        doc.text("INVOICE INFORMATION", 20, 95);
        doc.setFont("helvetica", "normal");
        doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 105);
        doc.text(`Issue Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 20, 112);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 20, 119);
        doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 20, 126);
        
        // Right column - Customer details  
        doc.setFont("helvetica", "bold");
        doc.text("CUSTOMER DETAILS", pageWidth / 2 + 10, 95);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${invoice.customer?.firstName} ${invoice.customer?.lastName}`, pageWidth / 2 + 10, 105);
        let customerYOffset = 112;
        if (invoice.customer?.phone) {
          doc.text(`Phone: ${invoice.customer.phone}`, pageWidth / 2 + 10, customerYOffset);
          customerYOffset += 7;
        }
        if (invoice.customer?.email) {
          doc.text(`Email: ${invoice.customer.email}`, pageWidth / 2 + 10, customerYOffset);
          customerYOffset += 7;
        }
        // Prioritize manual GST number from invoice over customer's stored GST
        const gstNumber = invoice.customerGstNumber || invoice.customer?.gstNumber;
        if (gstNumber) {
          doc.text(`GST No: ${gstNumber}`, pageWidth / 2 + 10, customerYOffset);
        }
        
        // Items table with professional styling
        const items = JSON.parse(invoice.items || '[]');
        let startY = 140;
        
        if (items.length > 0) {
          const tableData = items.map((item: any) => [
            item.name,
            item.quantity.toString(),
            formatCurrency(item.price),
            formatCurrency(item.quantity * item.price)
          ]);
          
          autoTable(doc, {
            startY: startY,
            head: [['Item Description', 'Quantity', 'Unit Price', 'Total Amount']],
            body: tableData,
            headStyles: {
              fillColor: [66, 135, 245],
              textColor: [255, 255, 255],
              fontSize: 12,
              fontStyle: 'bold',
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 11,
              cellPadding: 6,
              lineColor: [200, 200, 200],
              lineWidth: 0.5
            },
            columnStyles: {
              0: { cellWidth: 60, halign: 'left' },
              1: { cellWidth: 20, halign: 'center' },
              2: { cellWidth: 45, halign: 'right' },
              3: { cellWidth: 55, halign: 'right' }
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            margin: { left: 20, right: 20 }
          });
        }
        
        // Summary calculations and table
        const finalY = (doc as any).lastAutoTable?.finalY + 15 || 160;
        
        const summaryData = [
          ['Subtotal:', formatCurrency(parseFloat(invoice.subtotal))],
          [`GST (${(parseFloat(invoice.taxRate) * 100).toFixed(1)}%):`, formatCurrency(parseFloat(invoice.taxAmount))]
        ];
        
        autoTable(doc, {
          startY: finalY,
          body: summaryData,
          bodyStyles: {
            fontSize: 11,
            cellPadding: 4,
            lineColor: [200, 200, 200],
            lineWidth: 0.5
          },
          columnStyles: {
            0: { cellWidth: 125, halign: 'right', fontStyle: 'bold' },
            1: { cellWidth: 55, halign: 'right' }
          },
          margin: { left: 20, right: 20 },
          theme: 'plain'
        });
        
        // Total amount with emphasis
        const totalY = (doc as any).lastAutoTable.finalY + 5;
        autoTable(doc, {
          startY: totalY,
          body: [['TOTAL AMOUNT:', formatCurrency(parseFloat(invoice.total))]],
          bodyStyles: {
            fontSize: 14,
            cellPadding: 8,
            fontStyle: 'bold',
            fillColor: [66, 135, 245],
            textColor: [255, 255, 255]
          },
          columnStyles: {
            0: { cellWidth: 125, halign: 'right' },
            1: { cellWidth: 55, halign: 'right' }
          },
          margin: { left: 20, right: 20 },
          theme: 'plain'
        });
        
        // Professional footer with thank you message
        const footerY = Math.max((doc as any).lastAutoTable.finalY + 40, 240);
        
        // Thank you message
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(66, 135, 245);
        doc.text("Thank you for shopping with us!", pageWidth / 2, footerY, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("We are delighted to serve you and appreciate your trust in our products.", pageWidth / 2, footerY + 10, { align: "center" });
        doc.text("Visit us again for quality cycles and exceptional service!", pageWidth / 2, footerY + 20, { align: "center" });
        
        // Terms and conditions
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Terms: Payment due within 30 days. All sales final. Warranty as per manufacturer terms.", pageWidth / 2, footerY + 35, { align: "center" });
        
        doc.save(`new-sale-invoice-${invoice.invoiceNumber}.pdf`);
        console.log('PDF generation completed successfully');
        
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
    return <div className="flex justify-center p-8">Loading new sale invoices...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sales Metrics Dashboard Cards */}
      {salesMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Sales Invoices</CardTitle>
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{salesMetrics.totalSalesInvoices}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">All new sale invoices</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Sales Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(salesMetrics.totalSalesRevenue)}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Total earnings from sales</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Sales</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{salesMetrics.pendingSales}</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Completed Sales</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{salesMetrics.completedSales}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Paid sales</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Overdue Sales</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{salesMetrics.overdueSales}</div>
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
              placeholder="Search new sale invoices..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
          <Button 
            variant="outline" 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Company Settings
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Sale Invoice
          </Button>
        </div>
      </div>

      {/* GST Warning */}
      {!companySettings?.gstNumber && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Settings className="h-4 w-4" />
              <span className="text-sm">
                Configure your company GST details in settings to include them on invoices.
              </span>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-yellow-800 dark:text-yellow-200 p-0 h-auto"
              >
                Configure now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <div className="grid gap-4">
        {paginatedInvoices.map((invoice: any) => {
          const items = JSON.parse(invoice.items || '[]');
          
          return (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                      <Badge className={getStatusColor(invoice.paymentStatus)}>
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        <span className="capitalize">{invoice.paymentStatus}</span>
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
                        <p className="text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    
                    {/* Item preview */}
                    {items.length > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <p className="font-medium mb-1">Items:</p>
                        <div className="space-y-1">
                          {items.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <p className="text-gray-500">... and {items.length - 3} more items</p>
                          )}
                        </div>
                      </div>
                    )}
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
                          <AlertDialogTitle>Delete New Sale Invoice</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete invoice {invoice.invoiceNumber}? This will also restore the inventory quantities for sold items. This action cannot be undone.
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
          );
        })}

        {paginatedInvoices.length === 0 && filteredInvoices.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No new sale invoices found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first new sale invoice.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Sale Invoice
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {filteredInvoices.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredInvoices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Enhanced Invoice Modal for creating and editing */}
      <EnhancedInvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvoice(null);
        }} 
        invoice={editingInvoice}
      />

      <CompanySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}