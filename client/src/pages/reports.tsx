import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Download, Users, Wrench, 
  DollarSign, Package, TrendingUp 
} from "lucide-react";
import type { DashboardMetrics } from "@/types";
import { formatCurrency } from "@/lib/currency";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const { toast } = useToast();

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: workOrdersData } = useQuery({
    queryKey: ["/api/work-orders"],
    queryFn: async () => {
      const res = await fetch("/api/work-orders");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: inventoryItemsData } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Ensure all data is arrays
  const workOrders = Array.isArray(workOrdersData) ? workOrdersData : [];
  const customers = Array.isArray(customersData) ? customersData : [];
  const inventoryItems = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];

  const exportFinancialReport = () => {
    try {
      console.log("Exporting financial report");
      const exportData = workOrders.map(order => ({
        'Order Number': order.orderNumber,
        'Customer': `${order.customer?.firstName} ${order.customer?.lastName}`,
        'Date': new Date(order.createdAt).toLocaleDateString(),
        'Status': order.status,
        'Estimated Cost': order.estimatedCost ? formatCurrency(parseFloat(order.estimatedCost)) : 'N/A',
        'Machine': order.machine?.name || 'N/A',
        'Problem': order.problemDescription,
        'Technician': order.technician ? `${order.technician.firstName} ${order.technician.lastName}` : 'Unassigned',
        'Priority': order.priority,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
      XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Financial report exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export financial report",
        variant: "destructive",
      });
    }
  };

  const exportInventoryReport = () => {
    try {
      console.log("Exporting inventory report");
      const exportData = inventoryItems.map(item => ({
        'SKU': item.sku || 'N/A',
        'Name': item.name,
        'Category': item.category,
        'Brand': item.brand,
        'Cost': formatCurrency(parseFloat(item.cost)),
        'Price': formatCurrency(parseFloat(item.price)),
        'Quantity': item.quantity,
        'Location': item.location,
        'Minimum Stock': item.minimumStock,
        'Warranty Years': item.warrantyPeriodYears,
        'Type': item.type,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
      XLSX.writeFile(wb, `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Inventory report exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export inventory report",
        variant: "destructive",
      });
    }
  };

  const exportCustomerReport = () => {
    try {
      console.log("Exporting customer report");
      const exportData = customers.map(customer => ({
        'First Name': customer.firstName,
        'Last Name': customer.lastName,
        'Phone': customer.phone,
        'Email': customer.email || 'N/A',
        'Address': customer.address,
        'City': customer.city,
        'Pincode': customer.pincode,
        'GST Number': customer.gstNumber || 'N/A',
        'Join Date': new Date(customer.createdAt).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customer Report");
      XLSX.writeFile(wb, `Customer_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Customer report exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export customer report",
        variant: "destructive",
      });
    }
  };

  const exportSummaryReport = () => {
    try {
      console.log("Exporting summary report");
      const summaryData = [
        {
          'Metric': 'Total Work Orders',
          'Value': workOrders.length,
          'Details': `${metrics?.activeRepairs || 0} active repairs`
        },
        {
          'Metric': 'Total Customers',
          'Value': customers.length,
          'Details': `${metrics?.newCustomers || 0} new this week`
        },
        {
          'Metric': 'Inventory Items',
          'Value': inventoryItems.length,
          'Details': `${metrics?.lowStockItems || 0} low stock items`
        },
        {
          'Metric': 'Due Today',
          'Value': metrics?.dueToday || 0,
          'Details': 'Work orders due today'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(summaryData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Summary Report");
      XLSX.writeFile(wb, `Summary_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Summary report exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export summary report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Business insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportSummaryReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-md flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Repairs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics?.activeRepairs || 0}</div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  In progress
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Work Orders</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{workOrders?.length || 0}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {metrics?.dueToday || 0} due today
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customers?.length || 0}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  {metrics?.newCustomers || 0} new this week
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-md flex items-center justify-center">
                  <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Inventory Items</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{inventoryItems?.length || 0}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  {metrics?.lowStockItems || 0} low stock
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Financial Report</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Export work orders and cost details</p>
                <Button onClick={exportFinancialReport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Financial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors">
              <CardContent className="p-6 text-center">
                <Package className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Inventory Report</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Export inventory items and stock levels</p>
                <Button onClick={exportInventoryReport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Inventory
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Customer Report</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Export customer information and details</p>
                <Button onClick={exportCustomerReport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Customer
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Work Order Status Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Work Order Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {workOrders.filter((wo: any) => wo.status === "pending").length}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-500">Pending</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {workOrders.filter((wo: any) => wo.status === "in_progress").length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-500">In Progress</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {workOrders.filter((wo: any) => wo.status === "completed").length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-500">Completed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-400">
                {workOrders.filter((wo: any) => wo.status === "on_hold").length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-500">On Hold</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {workOrders.filter((wo: any) => wo.status === "cancelled").length}
              </div>
              <div className="text-sm text-red-600 dark:text-red-500">Cancelled</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}