import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Navbar is imported from protected route layout
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

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Calculate metrics
  const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price)), 0);
  const lowStockCount = lowStockItems.length;

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-3">
          <div className="flex items-center">
            <Package className="h-4 w-4 text-blue-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Total Items</div>
              <div className="text-lg font-bold">{totalItems}</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center">
            <Package className="h-4 w-4 text-green-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Total Value</div>
              <div className="text-lg font-bold">{formatCurrency(totalValue)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Low Stock</div>
              <div className="text-lg font-bold">{lowStockCount}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low on stock
        </div>
      )}

      {/* Compact Inventory Table */}
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
      ) : inventoryItems && inventoryItems.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800 text-xs">
                    <TableHead className="w-[25%] font-semibold py-2">Item Name</TableHead>
                    <TableHead className="w-[10%] font-semibold py-2">SKU</TableHead>
                    <TableHead className="w-[12%] font-semibold py-2">Category</TableHead>
                    <TableHead className="w-[10%] font-semibold py-2">Brand</TableHead>
                    <TableHead className="w-[8%] font-semibold text-center py-2">Stock</TableHead>
                    <TableHead className="w-[10%] font-semibold text-right py-2">Cost</TableHead>
                    <TableHead className="w-[10%] font-semibold text-right py-2">Price</TableHead>
                    <TableHead className="w-[15%] font-semibold text-center py-2">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-10">
                      <TableCell className="py-1">
                        <div className="space-y-0.5">
                          <div className="font-medium text-sm leading-tight">{item.name}</div>
                          <div className="text-xs text-gray-500 leading-tight truncate max-w-[150px]" title={item.description}>
                            {item.description || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="font-mono text-xs">{item.sku || ''}</div>
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          {item.brand}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-medium text-sm ${
                            item.quantity <= item.minimumStock 
                              ? "text-red-600" 
                              : item.quantity <= item.minimumStock * 2 
                              ? "text-orange-600" 
                              : "text-green-600"
                          }`}>
                            {item.quantity}
                          </span>
                          {item.quantity <= item.minimumStock && (
                            <span className="text-xs text-red-500">Low</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        <span className="text-sm">{formatCurrency(parseFloat(item.cost))}</span>
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        <span className="text-sm font-medium">{formatCurrency(parseFloat(item.price))}</span>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (item.quantity > 0) {
                                updateInventoryMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity - 1,
                                });
                              }
                            }}
                            disabled={item.quantity <= 0 || updateInventoryMutation.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updateInventoryMutation.mutate({
                                id: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                            disabled={updateInventoryMutation.isPending}
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-3 w-3" />
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
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first inventory item.</p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      )}

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
      />
    </div>
  );
}