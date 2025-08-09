import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, MapPin } from "lucide-react";
import CustomerModal from "@/components/modals/customer-modal";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/customers?search=${encodeURIComponent(searchTerm)}`
        : "/api/customers";
      const res = await fetch(url);
      return res.json();
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600">Manage customer information and history</p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700"
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
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button size="sm" className="flex-1 bg-primary-600 hover:bg-primary-700">
                        New Order
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
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
