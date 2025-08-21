import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, Phone, MapPin, Edit, User } from "lucide-react";
import CustomerModal from "@/components/modals/customer-modal";
import { useToast } from "@/hooks/use-toast";
import type { Customer, insertCustomerSchema, selectCustomerSchema } from "@shared/schema";

type CustomerType = typeof selectCustomerSchema._type;
import { apiRequest } from "@/lib/queryClient";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customersData, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/customers", searchTerm],
    queryFn: async () => {
      try {
        const url = searchTerm 
          ? `/api/customers?search=${encodeURIComponent(searchTerm)}`
          : "/api/customers";
        const res = await apiRequest("GET", url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        return [];
      }
    },
    retry: 3,
  });

  // Ensure data is always an array
  const customers = Array.isArray(customersData) ? customersData : [];

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest("DELETE", `/api/customers/${customerId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleEditCustomer = (customer: CustomerType) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower) ||
      customer.gstNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-blue-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Total Customers</div>
              <div className="text-lg font-bold">{customers.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-green-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">With Phone</div>
              <div className="text-lg font-bold">{customers.filter(c => c.phone).length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-orange-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">With Address</div>
              <div className="text-lg font-bold">{customers.filter(c => c.address).length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search customers by name, phone, email, address, or GST number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Compact Customers Table */}
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
      ) : filteredCustomers && filteredCustomers.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800 text-xs">
                    <TableHead className="w-[20%] font-semibold py-2">Name</TableHead>
                    <TableHead className="w-[15%] font-semibold py-2">Phone</TableHead>
                    <TableHead className="w-[20%] font-semibold py-2">Email</TableHead>
                    <TableHead className="w-[25%] font-semibold py-2">Address</TableHead>
                    <TableHead className="w-[10%] font-semibold py-2">GST</TableHead>
                    <TableHead className="w-[10%] font-semibold text-center py-2">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-10">
                      <TableCell className="py-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{customer.firstName} {customer.lastName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{customer.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <span className="text-sm">{customer.email || '-'}</span>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="text-sm truncate max-w-[200px]" title={customer.address || ''}>
                          {customer.address || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        {customer.gstNumber ? (
                          <Badge variant="outline" className="text-xs">GST</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditCustomer(customer)}
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
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No customers found" : "No customers yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No customers match "${searchTerm}". Try a different search term.`
                : "Get started by adding your first customer."
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Customer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
      />
    </div>
  );
}