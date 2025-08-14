import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Phone, Mail, MapPin, Trash2, History, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import CustomerModal from "@/components/modals/customer-modal";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customersData, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/customers?search=${encodeURIComponent(searchTerm)}`
        : "/api/customers";
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: customerHistoryData } = useQuery({
    queryKey: ["/api/invoices", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      const res = await fetch(`/api/invoices?customerId=${selectedCustomer.id}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedCustomer?.id,
  });

  // Ensure data is always arrays
  const customers = Array.isArray(customersData) ? customersData : [];
  const customerHistory = Array.isArray(customerHistoryData) ? customerHistoryData : [];

  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest("DELETE", `/api/customers/${customerId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer deleted",
        description: "Customer has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      let errorMessage = "Failed to delete customer";
      
      // Parse error message from different formats
      if (error?.message) {
        const match = error.message.match(/\d+: (.+)/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.message || errorMessage;
          } catch {
            errorMessage = match[1] || errorMessage;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Cannot Delete Customer",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage customer information and history</p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : customers && customers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {getInitials(customer.firstName, customer.lastName)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Customer since {formatDate(customer.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {customer.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {customer.email}
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="truncate">
                            {customer.address}
                            {customer.city && `, ${customer.city}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowHistory(true);
                        }}
                      >
                        <History className="h-3 w-3 mr-1" />
                        History
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this customer?')) {
                            deleteMutation.mutate(customer.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No customers found</h3>
                  <p>
                    {searchTerm 
                      ? "Try adjusting your search criteria" 
                      : "Get started by adding your first customer"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
      />

      {/* Customer History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Purchase History - {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {customerHistory && customerHistory.length > 0 ? (
              <div className="space-y-3">
                {customerHistory.map((invoice: any) => (
                  <Card key={invoice.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {invoice.invoiceNumber}
                            </Badge>
                            <Badge 
                              variant={invoice.paymentStatus === 'paid' ? 'default' : 'secondary'}
                              className={invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {invoice.paymentStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatDate(invoice.createdAt)}
                          </p>
                          {invoice.notes && (
                            <p className="text-sm text-gray-500 mt-2">
                              {invoice.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(Number(invoice.total))}
                          </p>
                          {invoice.taxAmount > 0 && (
                            <p className="text-xs text-gray-500">
                              Tax: {formatCurrency(Number(invoice.taxAmount))}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Purchase Value:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(
                        customerHistory.reduce((sum: number, invoice: any) => 
                          sum + Number(invoice.total), 0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No purchase history found for this customer.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
