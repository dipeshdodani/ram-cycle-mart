import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Search, Download, AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

export default function WarrantyDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();

  const { data: inventoryData = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/inventory");
      return await res.json();
    },
  });

  const { data: invoicesData = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      return await res.json();
    },
  });

  // Process warranty data
  const warrantyItems = useMemo(() => {
    if (!Array.isArray(inventoryData) || !Array.isArray(invoicesData)) return [];

    return inventoryData
      .filter((item: any) => item.warrantyPeriodYears > 0)
      .map((item: any) => {
        // Find sales of this item
        const itemSales = invoicesData
          .filter((invoice: any) => {
            if (!invoice.items) return false;
            try {
              const items = JSON.parse(invoice.items);
              return items.some((soldItem: any) => soldItem.inventoryItemId === item.id);
            } catch {
              return false;
            }
          })
          .map((invoice: any) => {
            const items = JSON.parse(invoice.items);
            const soldItem = items.find((i: any) => i.inventoryItemId === item.id);
            return {
              ...invoice,
              soldItem,
              warrantyStartDate: new Date(invoice.paymentDate || invoice.createdAt),
              warrantyEndDate: new Date(
                new Date(invoice.paymentDate || invoice.createdAt).getTime() +
                (item.warrantyPeriodYears * 365 * 24 * 60 * 60 * 1000)
              )
            };
          });

        return {
          ...item,
          sales: itemSales
        };
      })
      .filter((item: any) => item.sales.length > 0);
  }, [inventoryData, invoicesData]);

  // Flatten sales with warranty info
  const warrantySales = useMemo(() => {
    return warrantyItems.flatMap((item: any) =>
      item.sales.map((sale: any) => ({
        ...sale,
        itemName: item.name,
        itemSku: item.sku,
        warrantyPeriodYears: item.warrantyPeriodYears,
        warrantyStatus: sale.warrantyEndDate > new Date() ? 'active' : 'expired',
        daysRemaining: Math.max(0, Math.ceil((sale.warrantyEndDate - new Date()) / (1000 * 60 * 60 * 24)))
      }))
    );
  }, [warrantyItems]);

  // Filter and search
  const filteredSales = useMemo(() => {
    let filtered = warrantySales;

    // Tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter((sale: any) => sale.warrantyStatus === 'active');
    } else if (activeTab === 'expired') {
      filtered = filtered.filter((sale: any) => sale.warrantyStatus === 'expired');
    } else if (activeTab === 'expiring') {
      filtered = filtered.filter((sale: any) => 
        sale.warrantyStatus === 'active' && sale.daysRemaining <= 30
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((sale: any) =>
        sale.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.itemSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${sale.customer?.firstName} ${sale.customer?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [warrantySales, activeTab, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const activeWarranties = warrantySales.filter((sale: any) => sale.warrantyStatus === 'active').length;
    const expiredWarranties = warrantySales.filter((sale: any) => sale.warrantyStatus === 'expired').length;
    const expiringSoon = warrantySales.filter((sale: any) => 
      sale.warrantyStatus === 'active' && sale.daysRemaining <= 30
    ).length;
    const totalWarrantyValue = warrantySales.reduce((sum: number, sale: any) => 
      sum + (sale.soldItem?.quantity || 0) * (sale.soldItem?.price || 0), 0
    );

    return {
      activeWarranties,
      expiredWarranties,
      expiringSoon,
      totalWarrantyValue
    };
  }, [warrantySales]);

  const exportToExcel = () => {
    if (filteredSales.length === 0) {
      toast({
        title: "No Data",
        description: "No warranty data to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredSales.map((sale: any) => ({
      'Item Name': sale.itemName,
      'SKU': sale.itemSku,
      'Customer': `${sale.customer?.firstName || ''} ${sale.customer?.lastName || ''}`.trim(),
      'Phone': sale.customer?.phone || '',
      'Email': sale.customer?.email || '',
      'Invoice Number': sale.invoiceNumber,
      'Sale Date': new Date(sale.createdAt).toLocaleDateString(),
      'Warranty Period (Years)': sale.warrantyPeriodYears,
      'Warranty Start': new Date(sale.warrantyStartDate).toLocaleDateString(),
      'Warranty End': new Date(sale.warrantyEndDate).toLocaleDateString(),
      'Status': sale.warrantyStatus,
      'Days Remaining': sale.warrantyStatus === 'active' ? sale.daysRemaining : 0,
      'Quantity Sold': sale.soldItem?.quantity || 0,
      'Sale Value (₹)': ((sale.soldItem?.quantity || 0) * (sale.soldItem?.price || 0)).toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Warranty Data');

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

    const fileName = `Warranty_Data_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Export Successful",
      description: `Warranty data exported to ${fileName}`,
    });
  };

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'expired') {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (daysRemaining <= 30) {
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
        Expiring Soon ({daysRemaining}d)
      </Badge>;
    }
    return <Badge variant="default" className="bg-green-500 hover:bg-green-600">
      Active ({daysRemaining}d)
    </Badge>;
  };

  if (inventoryLoading || invoicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading warranty data...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Warranty Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track product warranties and customer coverage
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Warranties</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.activeWarranties}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Currently covered</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.expiringSoon}</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Within 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.expiredWarranties}</div>
              <p className="text-xs text-red-600 dark:text-red-400">No longer covered</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Value</CardTitle>
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(stats.totalWarrantyValue)}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Warranty coverage value</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search warranties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* Warranty Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Warranty Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({warrantySales.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.activeWarranties})</TabsTrigger>
                <TabsTrigger value="expiring">Expiring ({stats.expiringSoon})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({stats.expiredWarranties})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredSales.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No warranty data found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          No warranties match the current filter criteria.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredSales.map((sale: any) => (
                      <Card key={`${sale.id}-${sale.itemSku}`} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{sale.itemName}</h3>
                                {getStatusBadge(sale.warrantyStatus, sale.daysRemaining)}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {sale.customer?.firstName} {sale.customer?.lastName}
                                  </p>
                                  <p>SKU: {sale.itemSku}</p>
                                  {sale.customer?.phone && <p>{sale.customer.phone}</p>}
                                </div>
                                <div>
                                  <p>Invoice: {sale.invoiceNumber}</p>
                                  <p>Sale Date: {new Date(sale.createdAt).toLocaleDateString()}</p>
                                  <p>Warranty: {sale.warrantyPeriodYears} year(s)</p>
                                </div>
                                <div>
                                  <p>Start: {new Date(sale.warrantyStartDate).toLocaleDateString()}</p>
                                  <p>End: {new Date(sale.warrantyEndDate).toLocaleDateString()}</p>
                                  <p className="font-medium">
                                    Value: {formatCurrency((sale.soldItem?.quantity || 0) * (sale.soldItem?.price || 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}