import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, DollarSign, FileText, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
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
  const { toast } = useToast();

  const { data: billsData, isLoading, refetch } = useQuery<AdvancedBill[]>({
    queryKey: ["/api/advanced-billing", dateFrom, dateTo],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('from', dateFrom);
        params.append('to', dateTo);
        
        const res = await fetch(`/api/advanced-billing?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Failed to fetch bills:", error);
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
        description: "Failed to export sales report",
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
    </div>
  );
}