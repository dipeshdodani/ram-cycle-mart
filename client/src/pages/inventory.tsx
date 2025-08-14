import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Package, AlertTriangle, TrendingDown, Edit, Minus, Plus as PlusIcon } from "lucide-react";
import InventoryModal from "@/components/modals/inventory-modal";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventoryData, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/inventory?search=${encodeURIComponent(searchTerm)}`
        : "/api/inventory";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: lowStockData } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/low-stock");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Ensure data is always an array
  const inventoryItems = Array.isArray(inventoryData) ? inventoryData : [];
  const lowStockItems = Array.isArray(lowStockData) ? lowStockData : [];

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    },
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { status: "out", color: "bg-red-100 text-red-800", icon: AlertTriangle };
    if (item.quantity <= item.minimumStock) return { status: "low", color: "bg-yellow-100 text-yellow-800", icon: TrendingDown };
    return { status: "good", color: "bg-green-100 text-green-800", icon: Package };
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const totalValue = inventoryItems.reduce((sum, item) => 
    sum + (parseFloat(item.cost.toString()) * item.quantity), 0);

  const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

  const lowStockCount = lowStockItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage parts, accessories, and supplies</p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Total Items</div>
                    <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Total Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(totalValue)}
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
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Low Stock Items</div>
                    <div className="text-2xl font-bold text-gray-900">{lowStockCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search inventory by name, SKU, category, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-orange-800 font-medium">
                    {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low on stock
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Items Table */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ) : inventoryItems && inventoryItems.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead className="w-[100px]">Brand</TableHead>
                        <TableHead className="w-[120px]">SKU</TableHead>
                        <TableHead className="w-[180px]">Product Name</TableHead>
                        <TableHead className="w-[150px]">Category</TableHead>
                        <TableHead className="w-[120px]">Cost</TableHead>
                        <TableHead className="w-[120px]">Price</TableHead>
                        <TableHead className="w-[100px]">Stock</TableHead>
                        <TableHead className="w-[100px]">Min Stock</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[150px]">Location</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item) => {
                        const stockStatus = getStockStatus(item);
                        return (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell>
                              <Badge variant={item.type === 'machine' ? 'default' : item.type === 'repairs' ? 'secondary' : 'outline'}>
                                {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Parts'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900 font-medium">{item.brand || "-"}</TableCell>
                            <TableCell className="text-gray-600 font-mono text-sm">{item.sku}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-900">{item.category}</TableCell>
                            <TableCell className="text-gray-900">{formatCurrency(item.cost)}</TableCell>
                            <TableCell className="text-gray-900 font-medium">{formatCurrency(item.price)}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-gray-900">{item.quantity}</span>
                            </TableCell>
                            <TableCell className="text-gray-600">{item.minimumStock}</TableCell>
                            <TableCell>
                              <Badge className={`${stockStatus.color} flex items-center gap-1 w-fit`}>
                                <stockStatus.icon className="h-3 w-3" />
                                {stockStatus.status.charAt(0).toUpperCase() + stockStatus.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900">{item.location || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditItem(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center border rounded">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateInventoryMutation.mutate({ 
                                      id: item.id, 
                                      quantity: Math.max(0, item.quantity - 1) 
                                    })}
                                    disabled={updateInventoryMutation.isPending || item.quantity <= 0}
                                    className="h-8 w-8 p-0 rounded-none"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="px-2 text-sm font-medium min-w-[30px] text-center">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateInventoryMutation.mutate({ 
                                      id: item.id, 
                                      quantity: item.quantity + 1 
                                    })}
                                    disabled={updateInventoryMutation.isPending}
                                    className="h-8 w-8 p-0 rounded-none"
                                  >
                                    <PlusIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No inventory items found</h3>
                  <p>
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : "Get started by adding your first inventory item"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <InventoryModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingItem={editingItem}
      />
    </div>
  );
}
