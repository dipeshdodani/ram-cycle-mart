import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, StarOff, Store, Phone, Mail, MapPin, Hash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransliterationInput } from "@/components/ui/transliteration-input";
import { TransliterationTextarea } from "@/components/ui/transliteration-textarea";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
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
    },
  });

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
        title: shop ? "Shop Updated" : "Shop Created",
        description: shop ? "Shop details updated successfully." : "New shop created successfully.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save shop details",
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
          <DialogTitle data-testid={`title-${shop ? 'edit' : 'create'}-shop`}>
            {shop ? t('editShop') : t('createShop')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-shop-name">{t('shopName')}</FormLabel>
                    <FormControl>
                      <TransliterationInput
                        {...field}
                        placeholder={t('enterShopName')}
                        data-testid="input-shop-name"
                      />
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
                    <FormLabel data-testid="label-shop-tagline">{t('tagline')}</FormLabel>
                    <FormControl>
                      <TransliterationInput
                        {...field}
                        value={field.value ?? ""}
                        placeholder={t('enterTagline')}
                        data-testid="input-shop-tagline"
                      />
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
                  <FormLabel data-testid="label-shop-description">{t('description')}</FormLabel>
                  <FormControl>
                    <TransliterationTextarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t('enterShopDescription')}
                      data-testid="textarea-shop-description"
                    />
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
                    <FormLabel data-testid="label-shop-phone">{t('phone')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('enterPhoneNumber')}
                        data-testid="input-shop-phone"
                      />
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
                    <FormLabel data-testid="label-shop-email">{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('enterEmailAddress')}
                        data-testid="input-shop-email"
                      />
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
                  <FormLabel data-testid="label-shop-address">{t('address')}</FormLabel>
                  <FormControl>
                    <TransliterationTextarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t('enterShopAddress')}
                      data-testid="textarea-shop-address"
                    />
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
                    <FormLabel data-testid="label-shop-city">{t('city')}</FormLabel>
                    <FormControl>
                      <TransliterationInput
                        {...field}
                        value={field.value ?? ""}
                        placeholder={t('enterCity')}
                        data-testid="input-shop-city"
                      />
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
                    <FormLabel data-testid="label-shop-state">{t('state')}</FormLabel>
                    <FormControl>
                      <TransliterationInput
                        {...field}
                        value={field.value ?? ""}
                        placeholder={t('enterState')}
                        data-testid="input-shop-state"
                      />
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
                    <FormLabel data-testid="label-shop-pincode">{t('pincode')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('enterPincode')}
                        data-testid="input-shop-pincode"
                      />
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
                    <FormLabel data-testid="label-shop-gstin">{t('gstNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('enterGSTIN')}
                        data-testid="input-shop-gstin"
                      />
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
                    <FormLabel data-testid="label-shop-pan">{t('panNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('enterPANNumber')}
                        data-testid="input-shop-pan"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-shop-website">{t('website')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('enterWebsiteURL')}
                        data-testid="input-shop-website"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-shop-logo">{t('logoURL')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('enterLogoURL')}
                        data-testid="input-shop-logo"
                      />
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
                      data-testid="checkbox-shop-default"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel data-testid="label-shop-default">
                      {t('setAsDefaultShop')}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t('defaultShopDescription')}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-shop"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-save-shop"
              >
                {mutation.isPending ? t('saving') : (shop ? t('updateShop') : t('createShop'))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ShopManagement() {
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: shops = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/shops"],
  });

  const deleteShopMutation = useMutation({
    mutationFn: (shopId: string) => apiRequest("DELETE", `/api/shops/${shopId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      toast({
        title: t('shopDeleted'),
        description: t('shopDeletedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToDeleteShop'),
        variant: "destructive",
      });
    },
  });

  const setDefaultShopMutation = useMutation({
    mutationFn: (shopId: string) => apiRequest("PATCH", `/api/shops/${shopId}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      toast({
        title: t('defaultShopSet'),
        description: t('defaultShopSetDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToSetDefaultShop'),
        variant: "destructive",
      });
    },
  });

  const handleEdit = (shop: any) => {
    setSelectedShop(shop);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedShop(null);
    setIsModalOpen(true);
  };

  const handleDelete = (shopId: string) => {
    if (confirm(t('confirmDeleteShop'))) {
      deleteShopMutation.mutate(shopId);
    }
  };

  const handleSetDefault = (shopId: string) => {
    setDefaultShopMutation.mutate(shopId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShop(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-shop-management">
            {t('shopManagement')}
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="description-shop-management">
            {t('manageShopDetailsForBilling')}
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-add-shop">
          <Plus className="h-4 w-4 mr-2" />
          {t('addShop')}
        </Button>
      </div>

      {shops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-shops">
              {t('noShopsFound')}
            </h3>
            <p className="text-muted-foreground text-center mb-4" data-testid="text-no-shops-description">
              {t('noShopsDescription')}
            </p>
            <Button onClick={handleCreate} data-testid="button-create-first-shop">
              <Plus className="h-4 w-4 mr-2" />
              {t('createFirstShop')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop: any) => (
            <Card key={shop.id} className="relative" data-testid={`card-shop-${shop.id}`}>
              {shop.isDefault && (
                <div className="absolute top-3 right-3">
                  <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600" data-testid={`badge-default-${shop.id}`}>
                    <Star className="h-3 w-3 mr-1" />
                    {t('default')}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-12">
                    <CardTitle className="text-xl mb-1" data-testid={`text-shop-name-${shop.id}`}>
                      {shop.name}
                    </CardTitle>
                    {shop.tagline && (
                      <CardDescription className="text-sm" data-testid={`text-shop-tagline-${shop.id}`}>
                        {shop.tagline}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {shop.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-shop-description-${shop.id}`}>
                    {shop.description}
                  </p>
                )}

                <div className="space-y-2">
                  {shop.phone && (
                    <div className="flex items-center text-sm" data-testid={`text-shop-phone-${shop.id}`}>
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {shop.phone}
                    </div>
                  )}
                  
                  {shop.email && (
                    <div className="flex items-center text-sm" data-testid={`text-shop-email-${shop.id}`}>
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {shop.email}
                    </div>
                  )}
                  
                  {shop.address && (
                    <div className="flex items-start text-sm" data-testid={`text-shop-address-${shop.id}`}>
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        {shop.address}
                        {(shop.city || shop.state || shop.pincode) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {[shop.city, shop.state, shop.pincode].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {shop.gstin && (
                    <div className="flex items-center text-sm" data-testid={`text-shop-gstin-${shop.id}`}>
                      <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                      GST: {shop.gstin}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(shop)}
                      data-testid={`button-edit-shop-${shop.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(shop.id)}
                      data-testid={`button-delete-shop-${shop.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {!shop.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(shop.id)}
                      disabled={setDefaultShopMutation.isPending}
                      data-testid={`button-set-default-${shop.id}`}
                    >
                      <StarOff className="h-3 w-3 mr-1" />
                      {t('setDefault')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShopModal
        shop={selectedShop}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}