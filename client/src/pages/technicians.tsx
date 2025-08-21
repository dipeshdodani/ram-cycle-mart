import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, User, Wrench, Search, Mail, Phone, Edit } from "lucide-react";
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
                placeholder="Search by name, email, phone, role, or skills..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Technicians Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Work Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : filteredTechnicians.length > 0 ? (
                filteredTechnicians.map((technician: any) => (
                  <TableRow key={technician.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{technician.firstName} {technician.lastName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {technician.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {technician.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {technician.phone ? (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {technician.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Wrench className="h-4 w-4 mr-2 text-gray-400" />
                        {technician.activeWorkOrders || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={technician.isActive ? "default" : "secondary"}
                        className={technician.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {technician.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedTechnician(technician);
                          setIsModalOpen(true);
                        }}
                        title="Edit Technician"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-12">
                    <div className="text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No technicians found</h3>
                      <p>Get started by adding your first technician</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
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