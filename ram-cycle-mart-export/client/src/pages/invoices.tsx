import { useState } from "react";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceBilling from "@/components/billing/service-billing";
import NewSaleBilling from "@/components/billing/new-sale-billing";
import { FileText, ShoppingCart } from "lucide-react";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("services");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage service invoices and new sale billing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Billing System</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="services" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="new-sale" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  New Sale
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="services" className="mt-6">
                <ServiceBilling />
              </TabsContent>
              
              <TabsContent value="new-sale" className="mt-6">
                <NewSaleBilling />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}