import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Download, DollarSign, FileText, TrendingUp, Edit, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';

interface AdvancedBill {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerGstNumber: string;
  items: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  paymentMode: string;
  billType: string;
  advancePayment: string;
  dueAmount: string;
  createdAt: string;
  updatedAt: string;
}

export default function SalesReports() {
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingBill, setEditingBill] = useState<AdvancedBill | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billsData, isLoading, refetch } = useQuery<AdvancedBill[]>({
    queryKey: ["/api/advanced-bills", dateFrom, dateTo],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('from', dateFrom);
        params.append('to', dateTo);
        
        const res = await fetch(`/api/advanced-bills?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Failed to fetch bills:", error);
        toast({
          title: "Unable to Load Sales Data",
          description: "There was a problem loading your sales reports. Please try refreshing the page.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const bills = Array.isArray(billsData) ? billsData : [];

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSales = bills.reduce((sum, bill) => sum + parseFloat(bill.total || '0'), 0);
    const totalAdvancePayments = bills.reduce((sum, bill) => sum + parseFloat(bill.advancePayment || '0'), 0);
    const totalDueAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.dueAmount || '0'), 0);
    const gstBills = bills.filter(bill => bill.billType === 'gst').length;
    const nonGstBills = bills.filter(bill => bill.billType === 'non-gst').length;

    return {
      totalSales,
      totalAdvancePayments,
      totalDueAmount,
      totalBills: bills.length,
      gstBills,
      nonGstBills,
      averageBillValue: bills.length > 0 ? totalSales / bills.length : 0
    };
  }, [bills]);

  const handleDateFilterChange = () => {
    refetch();
  };

  const updateBillMutation = useMutation({
    mutationFn: async (updatedBill: { id: string; advancePayment: string; dueAmount: string }) => {
      const response = await apiRequest("PATCH", `/api/advanced-bills/${updatedBill.id}`, updatedBill);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advanced-bills"] });
      toast({
        title: "Bill Updated Successfully",
        description: "Payment details have been updated.",
      });
      setIsEditDialogOpen(false);
      setEditingBill(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: "Unable to update the bill. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsPaid = (bill: AdvancedBill) => {
    const totalAmount = parseFloat(bill.total);
    updateBillMutation.mutate({
      id: bill.id,
      advancePayment: bill.total,
      dueAmount: "0.00"
    });
  };

  const handleEditBill = (bill: AdvancedBill) => {
    setEditingBill(bill);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingBill) return;
    
    const advance = parseFloat(editingBill.advancePayment || '0');
    const total = parseFloat(editingBill.total || '0');
    const due = Math.max(0, total - advance).toFixed(2);
    
    updateBillMutation.mutate({
      id: editingBill.id,
      advancePayment: advance.toFixed(2),
      dueAmount: due
    });
  };

  const exportToExcel = () => {
    try {
      const exportData = bills.map(bill => {
        const items = JSON.parse(bill.items || '[]');
        return {
          'Bill Number': bill.billNumber,
          'Date': format(new Date(bill.createdAt), 'dd/MM/yyyy'),
          'Customer Name': bill.customerName,
          'Customer Phone': bill.customerPhone,
          'Customer Address': bill.customerAddress,
          'GST Number': bill.customerGstNumber || 'N/A',
          'Bill Type': bill.billType.toUpperCase(),
          'Items': items.map((item: any) => `${item.name} (${item.quantity})`).join(', '),
          'Subtotal': formatCurrency(parseFloat(bill.subtotal)),
          'Tax Rate': `${bill.taxRate}%`,
          'Tax Amount': formatCurrency(parseFloat(bill.taxAmount)),
          'Total Amount': formatCurrency(parseFloat(bill.total)),
          'Advance Payment': formatCurrency(parseFloat(bill.advancePayment)),
          'Due Amount': formatCurrency(parseFloat(bill.dueAmount)),
          'Payment Mode': bill.paymentMode.toUpperCase(),
          'Status': parseFloat(bill.dueAmount) > 0 ? 'PARTIAL PAID' : 'PAID'
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
      
      const filename = `Sales_Report_${format(new Date(dateFrom), 'ddMMyyyy')}_to_${format(new Date(dateTo), 'ddMMyyyy')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `Sales report exported as ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed", 
        description: "Unable to create the Excel file. Please try again or contact support if the problem continues.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Reports</h1>
          <p className="text-gray-600">View and analyze sales performance</p>
        </div>
        <Button onClick={exportToExcel} disabled={bills.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={handleDateFilterChange} className="mb-0">
              Update Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-600 mr-2" />
              <div>
                <div className="text-xs text-gray-500">Total Sales</div>
                <div className="text-lg font-bold">{formatCurrency(metrics.totalSales)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-blue-600 mr-2" />
              <div>
                <div className="text-xs text-gray-500">Total Bills</div>
                <div className="text-lg font-bold">{metrics.totalBills}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-600 mr-2" />
              <div>
                <div className="text-xs text-gray-500">Advance Received</div>
                <div className="text-lg font-bold">{formatCurrency(metrics.totalAdvancePayments)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-orange-600 mr-2" />
              <div>
                <div className="text-xs text-gray-500">Due Amount</div>
                <div className="text-lg font-bold text-red-600">{formatCurrency(metrics.totalDueAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : bills.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="font-semibold">Bill #</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold text-right">Advance</TableHead>
                    <TableHead className="font-semibold text-right">Due</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>{format(new Date(bill.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bill.customerName}</div>
                          <div className="text-sm text-gray-500">{bill.customerPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={bill.billType === 'gst' ? 'default' : 'secondary'}>
                          {bill.billType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(bill.total))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(bill.advancePayment))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={parseFloat(bill.dueAmount) > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                          {formatCurrency(parseFloat(bill.dueAmount))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {bill.paymentMode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={parseFloat(bill.dueAmount) > 0 ? "destructive" : "default"}>
                          {parseFloat(bill.dueAmount) > 0 ? "Partial Paid" : "Paid"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {parseFloat(bill.dueAmount) > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(bill)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditBill(bill)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales data found</h3>
            <p className="text-gray-500">
              No bills found for the selected date range. Try adjusting the dates or create some bills first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Bill Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Details</DialogTitle>
          </DialogHeader>
          {editingBill && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Bill Number</Label>
                <p className="text-sm text-gray-900">{editingBill.billNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Customer</Label>
                <p className="text-sm text-gray-900">{editingBill.customerName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Total Amount</Label>
                <p className="text-sm text-gray-900">{formatCurrency(parseFloat(editingBill.total))}</p>
              </div>
              <div>
                <Label htmlFor="advance-payment" className="text-sm font-medium text-gray-700">
                  Advance Payment Received
                </Label>
                <Input
                  id="advance-payment"
                  type="number"
                  step="0.01"
                  value={editingBill.advancePayment}
                  onChange={(e) => setEditingBill({ ...editingBill, advancePayment: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Due Amount</Label>
                <p className="text-sm text-gray-900">
                  {formatCurrency(Math.max(0, parseFloat(editingBill.total) - parseFloat(editingBill.advancePayment || '0')))}
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateBillMutation.isPending}>
                  {updateBillMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}