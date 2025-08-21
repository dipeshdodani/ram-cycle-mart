import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Clock, CheckCircle, AlertCircle, Trash2, Eye, Edit, Download } from "lucide-react";
import WorkOrderModal from "@/components/modals/work-order-modal";
import WorkOrderDetailsModal from "@/components/modals/work-order-details-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportToExcel, formatDateForExcel, formatCurrencyForExcel, formatStatusForExcel } from "@/lib/excel-export";
import Pagination from "@/components/ui/pagination";
import type { WorkOrderFilters } from "@/types";

export default function WorkOrders() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState<WorkOrderFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workOrdersData, isLoading } = useQuery({
    queryKey: ["/api/work-orders", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.customerId) params.append("customerId", filters.customerId);
      if (filters.technicianId) params.append("technicianId", filters.technicianId);
      
      const url = `/api/work-orders${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Ensure data is always an array
  const workOrders = Array.isArray(workOrdersData) ? workOrdersData : [];

  // Filter work orders based on search term and status
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(order => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase().includes(searchLower) ||
        order.customer?.phone?.toLowerCase().includes(searchLower) ||
        order.machine?.name?.toLowerCase().includes(searchLower) ||
        order.problemDescription?.toLowerCase().includes(searchLower) ||
        `${order.technician?.firstName || ''} ${order.technician?.lastName || ''}`.toLowerCase().includes(searchLower)
      );
    }).filter(order => {
      if (!filters.status) return true;
      return order.status === filters.status;
    });
  }, [workOrders, searchTerm, filters.status]);

  // Paginated data
  const paginatedWorkOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWorkOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWorkOrders, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const deleteWorkOrderMutation = useMutation({
    mutationFn: async (workOrderId: string) => {
      const res = await apiRequest("DELETE", `/api/work-orders/${workOrderId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Work Order Deleted",
        description: "Work order has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      let errorMessage = "Failed to delete work order";
      
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
        title: "Cannot Delete Work Order",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const handleExportToExcel = () => {
    const columns = [
      { key: 'orderNumber', header: 'Order Number' },
      { key: 'customer.firstName', header: 'Customer Name', formatter: (customer: any) => customer ? `${customer.firstName} ${customer.lastName}` : '' },
      { key: 'customer.phone', header: 'Customer Phone' },
      { key: 'machine.name', header: 'Machine/Equipment' },
      { key: 'problemDescription', header: 'Problem Description' },
      { key: 'status', header: 'Status', formatter: formatStatusForExcel },
      { key: 'priority', header: 'Priority', formatter: formatStatusForExcel },
      { key: 'estimatedCost', header: 'Estimated Cost', formatter: formatCurrencyForExcel },
      { key: 'actualCost', header: 'Actual Cost', formatter: formatCurrencyForExcel },
      { key: 'createdAt', header: 'Created Date', formatter: formatDateForExcel },
      { key: 'dueDate', header: 'Due Date', formatter: formatDateForExcel },
      { key: 'technician.firstName', header: 'Technician', formatter: (tech: any) => tech ? `${tech.firstName} ${tech.lastName}` : '' },
    ];

    exportToExcel(workOrders, columns, 'work-orders');
    toast({
      title: "Export Successful",
      description: "Work orders data has been exported to Excel.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
              <p className="text-gray-600">Manage repair and maintenance orders</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={handleExportToExcel}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Work Order
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative min-w-[300px] flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order ID, customer name, phone, machine model, or technician..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="min-w-[200px]">
                  <Select 
                    value={filters.status || ""} 
                    onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Orders */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : paginatedWorkOrders && paginatedWorkOrders.length > 0 ? (
                  paginatedWorkOrders.map((order: any) => (
                    <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer?.firstName} {order.customer?.lastName}</div>
                          <div className="text-sm text-gray-500">{order.customer?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={order.problemDescription}>
                          {order.problemDescription}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.technician ? (
                          <div className="text-sm">
                            {order.technician.firstName} {order.technician.lastName}
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.dueDate ? formatDate(order.dueDate) : "Not set"}
                      </TableCell>
                      <TableCell>
                        {order.estimatedCost ? formatCurrency(order.estimatedCost) : "Not set"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedWorkOrder(order);
                              setIsDetailsModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedWorkOrder(order);
                              setIsModalOpen(true);
                            }}
                            title="Edit Work Order"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
                                deleteWorkOrderMutation.mutate(order.id);
                              }
                            }}
                            disabled={deleteWorkOrderMutation.isPending}
                            title="Delete Work Order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center p-12">
                      <div className="text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No work orders found</h3>
                        <p>Create your first work order to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {workOrders.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalItems={workOrders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </div>
      </div>

      <WorkOrderModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWorkOrder(null);
        }}
        workOrder={selectedWorkOrder}
      />
      
      <WorkOrderDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedWorkOrder(null);
        }}
        workOrder={selectedWorkOrder}
      />
    </div>
  );
}
