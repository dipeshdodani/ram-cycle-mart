import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { insertCompanySettingsSchema, type InsertCompanySettings } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2 } from "lucide-react";

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanySettingsModal({ isOpen, onClose }: CompanySettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertCompanySettings>({
    resolver: zodResolver(insertCompanySettingsSchema),
    defaultValues: {
      companyName: "Ram Cycle Mart",
      gstNumber: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const { data: companySettings } = useQuery({
    queryKey: ["/api/company-settings"],
    queryFn: async () => {
      const res = await fetch("/api/company-settings");
      return res.json();
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: InsertCompanySettings) => {
      const method = companySettings?.id ? "PUT" : "POST";
      const url = companySettings?.id 
        ? `/api/company-settings/${companySettings.id}` 
        : "/api/company-settings";
      
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({
        title: "Company settings saved",
        description: "Company settings have been successfully saved.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save company settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCompanySettings) => {
    saveSettingsMutation.mutate(data);
  };

  // Load existing settings into form
  useEffect(() => {
    if (companySettings && isOpen) {
      form.reset({
        companyName: companySettings.companyName || "Ram Cycle Mart",
        gstNumber: companySettings.gstNumber || "",
        address: companySettings.address || "",
        phone: companySettings.phone || "",
        email: companySettings.email || "",
      });
    }
  }, [companySettings, isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Settings
          </DialogTitle>
          <DialogDescription>
            Configure your company information for invoices and billing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ram Cycle Mart" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="22AAAAA0000A1Z5" 
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    15-digit GST identification number (format: 22AAAAA0000A1Z5)
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter your complete business address"
                      rows={3}
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
                    <FormLabel>Phone Number</FormLabel>
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="info@ramcyclemart.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                GST Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Adding your GST number will automatically include it on all invoices. 
                This is required for businesses registered under GST in India.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}