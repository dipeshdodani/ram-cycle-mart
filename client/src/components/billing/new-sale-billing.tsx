import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ShoppingCart, Download, Settings, Trash2 } from "lucide-react";
import NewSaleInvoiceModal from "@/components/modals/new-sale-invoice-modal";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", "new_sale", searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "new_sale");
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const url = `/api/invoices?${params.toString()}`;
      const res = await fetch(url);
      return res.json();
    },
  });

  const { data: companySettings } = useQuery({
    queryKey: ["/api/company-settings"],
    queryFn: async () => {
      const res = await fetch("/api/company-settings");
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

  const generatePDF = (invoice: any) => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text(companySettings?.companyName || 'Ram Cycle Mart', 20, 20);
        
        if (companySettings?.address) {
          doc.setFontSize(10);
          doc.text(companySettings.address, 20, 28);
        }
        
        if (companySettings?.gstNumber) {
          doc.setFontSize(10);
          doc.text(`GST: ${companySettings.gstNumber}`, 20, 34);
        }
        
        doc.setFontSize(16);
        doc.text('New Sale Invoice', 20, 45);
        
        // Invoice details
        doc.setFontSize(12);
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 60);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 68);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 76);
        
        // Customer info
        doc.text('Bill To:', 20, 90);
        doc.text(`${invoice.customer?.firstName} ${invoice.customer?.lastName}`, 20, 98);
        if (invoice.customer?.phone) {
          doc.text(`Phone: ${invoice.customer.phone}`, 20, 106);
        }
        if (invoice.customer?.email) {
          doc.text(`Email: ${invoice.customer.email}`, 20, 114);
        }
        
        // Items table
        const items = JSON.parse(invoice.items || '[]');
        if (items.length > 0) {
          const tableData = items.map((item: any) => [
            item.name,
            item.quantity.toString(),
            formatCurrency(item.price),
            formatCurrency(item.quantity * item.price)
          ]);
          
          (doc as any).autoTable({
            startY: 125,
            head: [['Item', 'Qty', 'Price', 'Total']],
            body: tableData,
          });
        }
        
        const finalY = (doc as any).lastAutoTable.finalY || 140;
        
        // Amounts
        doc.text(`Subtotal: ${formatCurrency(parseFloat(invoice.subtotal))}`, 130, finalY + 15);
        doc.text(`GST (${(parseFloat(invoice.taxRate) * 100).toFixed(1)}%): ${formatCurrency(parseFloat(invoice.taxAmount))}`, 130, finalY + 23);
        doc.setFontSize(14);
        doc.text(`Total: ${formatCurrency(parseFloat(invoice.total))}`, 130, finalY + 33);
        
        // Status
        doc.setFontSize(12);
        doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 20, finalY + 50);
        
        doc.save(`new-sale-invoice-${invoice.invoiceNumber}.pdf`);
      });
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading new sale invoices...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search new sale invoices..."
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
        {filteredInvoices.map((invoice: any) => {
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

        {filteredInvoices.length === 0 && (
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

      <NewSaleInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <CompanySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}