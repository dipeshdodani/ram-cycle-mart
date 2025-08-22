import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, StarOff, Store, Phone, Mail, MapPin, Hash, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TransliterationInput } from "@/components/ui/transliteration-input";
import { TransliterationTextarea } from "@/components/ui/transliteration-textarea";

const shopSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  tagline: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  panNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

type ShopFormData = z.infer<typeof shopSchema>;

function ShopModal({ shop, isOpen, onClose }: { shop?: any; isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: "",
      tagline: "",
      description: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      panNumber: "",
      website: "",
      logoUrl: "",
      isDefault: false,
    },
  });

  // Reset form when shop data changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: shop?.name ?? "",
        tagline: shop?.tagline ?? "",
        description: shop?.description ?? "",
        phone: shop?.phone ?? "",
        email: shop?.email ?? "",
        address: shop?.address ?? "",
        city: shop?.city ?? "",
        state: shop?.state ?? "",
        pincode: shop?.pincode ?? "",
        gstin: shop?.gstin ?? "",
        panNumber: shop?.panNumber ?? "",
        website: shop?.website ?? "",
        logoUrl: shop?.logoUrl ?? "",
        isDefault: shop?.isDefault ?? false,
      });
    }
  }, [shop, isOpen, form]);

  const mutation = useMutation({
    mutationFn: async (data: ShopFormData) => {
      if (shop) {
        return apiRequest("PATCH", `/api/shops/${shop.id}`, data);
      } else {
        return apiRequest("POST", "/api/shops", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      toast({
        title: "Success",
        description: shop ? "Shop updated successfully" : "Shop created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save shop",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShopFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shop ? "Edit Shop" : "Add New Shop"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name *</FormLabel>
                    <FormControl>
                      <TransliterationInput {...field} placeholder="Ram Cycle Mart" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <TransliterationInput {...field} value={field.value || ""} placeholder="Service & Repair" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <TransliterationTextarea {...field} value={field.value || ""} placeholder="Complete sewing machine sales and service..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 98765 43210" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="info@ramcyclemart.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <TransliterationTextarea {...field} value={field.value || ""} placeholder="123 Main Street, Commercial Complex" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <TransliterationInput {...field} value={field.value || ""} placeholder="Ahmedabad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <TransliterationInput {...field} value={field.value || ""} placeholder="Gujarat" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="380001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="24ABCDE1234F1Z5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="panNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ABCDE1234F" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as Default Shop</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This shop will be used for billing and invoices
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : shop ? "Update Shop" : "Create Shop"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ShopManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: shopsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/shops"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shops");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const shops = Array.isArray(shopsData) ? shopsData : [];

  const deleteShopMutation = useMutation({
    mutationFn: async (shopId: string) => {
      const res = await apiRequest("DELETE", `/api/shops/${shopId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shop deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shop",
        variant: "destructive",
      });
    },
  });

  const setDefaultShopMutation = useMutation({
    mutationFn: async (shopId: string) => {
      const res = await apiRequest("PATCH", `/api/shops/${shopId}/set-default`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default shop updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default shop",
        variant: "destructive",
      });
    },
  });

  const handleEditShop = (shop: any) => {
    setEditingShop(shop);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingShop(null);
    setIsModalOpen(true);
  };

  const handleDeleteShop = (shopId: string) => {
    if (window.confirm("Are you sure you want to delete this shop?")) {
      deleteShopMutation.mutate(shopId);
    }
  };

  const handleSetDefault = (shopId: string) => {
    setDefaultShopMutation.mutate(shopId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShop(null);
  };

  // Filter shops based on search term
  const filteredShops = shops.filter(shop => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      shop.name?.toLowerCase().includes(searchLower) ||
      shop.phone?.toLowerCase().includes(searchLower) ||
      shop.email?.toLowerCase().includes(searchLower) ||
      shop.city?.toLowerCase().includes(searchLower) ||
      shop.gstin?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shop Management</h1>
        <Button onClick={handleAddNew} size="sm" data-testid="button-add-shop">
          <Plus className="h-4 w-4 mr-2" />
          Add Shop
        </Button>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-3">
          <div className="flex items-center">
            <Store className="h-4 w-4 text-primary mr-2" />
            <div>
              <div className="text-xs text-gray-500">Total Shops</div>
              <div className="text-lg font-bold">{shops.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Default Shop</div>
              <div className="text-lg font-bold">{shops.filter(s => s.isDefault).length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center">
            <Hash className="h-4 w-4 text-green-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">With GST</div>
              <div className="text-lg font-bold">{shops.filter(s => s.gstin).length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search shops by name, phone, email, city, or GST number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
            data-testid="input-search-shops"
          />
        </div>
      </div>

      {/* Shops Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredShops.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="font-semibold">Shop Name</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">GST</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShops.map((shop) => (
                    <TableRow key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center">
                            {shop.name}
                            {shop.isDefault && (
                              <Badge variant="default" className="ml-2 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          {shop.tagline && (
                            <div className="text-sm text-gray-500">{shop.tagline}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {shop.phone}
                          </div>
                          {shop.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-3 w-3 mr-1" />
                              {shop.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {shop.city || shop.state ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1" />
                            {[shop.city, shop.state].filter(Boolean).join(", ")}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {shop.gstin ? (
                          <div className="text-sm font-mono">{shop.gstin}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={shop.isDefault ? "default" : "secondary"}>
                          {shop.isDefault ? "Default" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!shop.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(shop.id)}
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                              data-testid={`button-set-default-${shop.id}`}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Set Default
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditShop(shop)}
                            data-testid={`button-edit-${shop.id}`}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteShop(shop.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${shop.id}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
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
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "No shops match your search criteria." : "Get started by adding your first shop."}
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Shop
            </Button>
          </CardContent>
        </Card>
      )}

      <ShopModal
        shop={editingShop}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}