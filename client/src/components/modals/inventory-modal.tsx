import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem } from "@shared/schema";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: InventoryItem | null;
}

export default function InventoryModal({ isOpen, onClose, editingItem }: InventoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    brand: "",
    cost: "",
    price: "",
    quantity: "",
    minimumStock: "",
    location: "",
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        sku: editingItem.sku,
        name: editingItem.name,
        description: editingItem.description || "",
        category: editingItem.category,
        brand: editingItem.brand || "",
        cost: editingItem.cost.toString(),
        price: editingItem.price.toString(),
        quantity: editingItem.quantity.toString(),
        minimumStock: editingItem.minimumStock.toString(),
        location: editingItem.location || "",
      });
    }
  }, [editingItem]);

  const createInventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        const res = await apiRequest("PUT", `/api/inventory/${editingItem.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/inventory", data);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Inventory item ${editingItem ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editingItem ? 'update' : 'create'} inventory item`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      minimumStock: parseInt(formData.minimumStock),
    };

    createInventoryMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      category: "",
      brand: "",
      cost: "",
      price: "",
      quantity: "",
      minimumStock: "",
      location: "",
    });
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="e.g., SG-BOB-001"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Singer Bobbins"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Item description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="e.g., Bobbins, Needles, Parts"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="e.g., Singer, Brother, Janome"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Cost *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="0"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="minimumStock">Minimum Stock *</Label>
              <Input
                id="minimumStock"
                type="number"
                value={formData.minimumStock}
                onChange={(e) => handleInputChange("minimumStock", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., Shelf A-3, Storage Room"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary-600 hover:bg-primary-700"
              disabled={createInventoryMutation.isPending}
            >
              {createInventoryMutation.isPending 
                ? (editingItem ? "Updating..." : "Creating...") 
                : (editingItem ? "Update Item" : "Add Item")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
