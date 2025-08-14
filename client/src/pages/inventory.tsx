import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, AlertTriangle, TrendingDown } from "lucide-react";
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

          {/* Inventory Items */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : inventoryItems && inventoryItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventoryItems.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        </div>
                        <Badge className={`${stockStatus.color} flex items-center gap-1`}>
                          <stockStatus.icon className="h-3 w-3" />
                          {stockStatus.status.charAt(0).toUpperCase() + stockStatus.status.slice(1)}
                        </Badge>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <p className="font-medium text-gray-500">Category</p>
                          <p className="text-gray-900">{item.category}</p>
                        </div>
                        {item.brand && (
                          <div>
                            <p className="font-medium text-gray-500">Brand</p>
                            <p className="text-gray-900">{item.brand}</p>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-500">Cost</p>
                          <p className="text-gray-900">{formatCurrency(item.cost)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Price</p>
                          <p className="text-gray-900">{formatCurrency(item.price)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">In Stock</p>
                          <p className="text-gray-900 font-semibold">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Min Stock</p>
                          <p className="text-gray-900">{item.minimumStock}</p>
                        </div>
                      </div>

                      {item.location && (
                        <div className="text-sm mb-4">
                          <p className="font-medium text-gray-500">Location</p>
                          <p className="text-gray-900">{item.location}</p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleEditItem(item)}
                        >
                          Edit
                        </Button>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateInventoryMutation.mutate({ 
                              id: item.id, 
                              quantity: Math.max(0, item.quantity - 1) 
                            })}
                            disabled={updateInventoryMutation.isPending || item.quantity <= 0}
                          >
                            -
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateInventoryMutation.mutate({ 
                              id: item.id, 
                              quantity: item.quantity + 1 
                            })}
                            disabled={updateInventoryMutation.isPending}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
