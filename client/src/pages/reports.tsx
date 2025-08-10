import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { 
  FileText, Download, Calendar, TrendingUp, Users, Wrench, 
  DollarSign, Package, Clock, CheckCircle 
} from "lucide-react";
import type { DashboardMetrics } from "@/types";
import { formatCurrency } from "@/lib/currency";

const COLORS = ["#1976D2", "#4CAF50", "#FF9800", "#F44336", "#9C27B0"];

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: workOrders } = useQuery({
    queryKey: ["/api/work-orders"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: inventoryItems } = useQuery({
    queryKey: ["/api/inventory"],
  });

  // Generate mock data for charts since we don't have historical data endpoints
  const revenueData = [
    { month: "Jan", revenue: 12400, orders: 24 },
    { month: "Feb", revenue: 18200, orders: 36 },
    { month: "Mar", revenue: 15800, orders: 31 },
    { month: "Apr", revenue: 22100, orders: 44 },
    { month: "May", revenue: 19600, orders: 39 },
    { month: "Jun", revenue: 25300, orders: 50 },
  ];

  const workOrderStatusData = workOrders ? [
    { name: "Pending", value: workOrders.filter((wo: any) => wo.status === "pending").length },
    { name: "In Progress", value: workOrders.filter((wo: any) => wo.status === "in_progress").length },
    { name: "Completed", value: workOrders.filter((wo: any) => wo.status === "completed").length },
    { name: "On Hold", value: workOrders.filter((wo: any) => wo.status === "on_hold").length },
    { name: "Cancelled", value: workOrders.filter((wo: any) => wo.status === "cancelled").length },
  ].filter(item => item.value > 0) : [];

  const topCategories = inventoryItems ? 
    Object.entries(
      inventoryItems.reduce((acc: any, item: any) => {
        acc[item.category] = (acc[item.category] || 0) + item.quantity;
        return acc;
      }, {})
    )
    .map(([category, quantity]) => ({ category, quantity }))
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5) : [];

  // Using imported formatCurrency from @/lib/currency

  const exportReport = (type: string) => {
    // In a real app, this would generate and download a report file
    console.log(`Exporting ${type} report`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">Business insights and performance metrics</p>
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
              <Button variant="outline" onClick={() => exportReport("summary")}>
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
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Revenue This Month</div>
                    <div className="text-2xl font-bold text-gray-900">₹25,300</div>
                    <div className="text-sm text-green-600">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      +12.5% from last month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Work Orders</div>
                    <div className="text-2xl font-bold text-gray-900">{workOrders?.length || 0}</div>
                    <div className="text-sm text-blue-600">
                      {metrics?.activeRepairs || 0} active
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Total Customers</div>
                    <div className="text-2xl font-bold text-gray-900">{customers?.length || 0}</div>
                    <div className="text-sm text-purple-600">
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
                    <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                      <Package className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Inventory Items</div>
                    <div className="text-2xl font-bold text-gray-900">{inventoryItems?.length || 0}</div>
                    <div className="text-sm text-orange-600">
                      {metrics?.lowStockItems || 0} low stock
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), "Revenue"]} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#1976D2" 
                      strokeWidth={2}
                      dot={{ fill: "#1976D2" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Work Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Work Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workOrderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workOrderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Inventory Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Top Inventory Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#1976D2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Completed Orders</span>
                    </div>
                    <span className="text-2xl font-bold text-green-900">
                      {workOrders?.filter((wo: any) => wo.status === "completed").length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Avg. Completion Time</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-900">3.5 days</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium text-purple-900">Customer Satisfaction</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-900">4.8/5</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="font-medium text-orange-900">Avg. Order Value</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-900">₹127</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => exportReport("financial")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Financial Report
                </Button>
                <Button variant="outline" onClick={() => exportReport("inventory")}>
                  <Package className="mr-2 h-4 w-4" />
                  Inventory Report
                </Button>
                <Button variant="outline" onClick={() => exportReport("customer")}>
                  <Users className="mr-2 h-4 w-4" />
                  Customer Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
