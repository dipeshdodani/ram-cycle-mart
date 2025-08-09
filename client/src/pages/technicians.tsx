import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, User, Wrench, Search, Mail, Phone } from "lucide-react";
import TechnicianModal from "@/components/modals/technician-modal";

export default function Technicians() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: technicians, isLoading } = useQuery({
    queryKey: ["/api/technicians"],
    queryFn: async () => {
      const res = await fetch("/api/technicians");
      return res.json();
    },
  });

  const filteredTechnicians = technicians?.filter((tech: any) =>
    tech.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Technician Management</h1>
            <p className="text-gray-600 mt-2">Manage your service technicians and their assignments</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Technician
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search technicians by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Technicians Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTechnicians.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTechnicians.map((technician: any) => (
              <Card key={technician.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {technician.firstName} {technician.lastName}
                      </h3>
                      <Badge variant="outline" className="capitalize mt-1">
                        {technician.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {technician.email}
                    </div>
                    {technician.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {technician.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Wrench className="h-4 w-4 mr-2" />
                      {technician.activeWorkOrders || 0} Active Work Orders
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <Badge 
                      variant={technician.isActive ? "default" : "secondary"}
                      className={technician.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {technician.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTechnician(technician);
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
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
                <User className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No technicians found</h3>
                <p>Get started by adding your first technician</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <TechnicianModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTechnician(null);
        }}
        technician={selectedTechnician}
      />
    </div>
  );
}