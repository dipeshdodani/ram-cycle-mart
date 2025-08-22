import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, User, Wrench, DollarSign, Calendar, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface WorkOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder?: any;
}

export default function WorkOrderDetailsModal({ isOpen, onClose, workOrder }: WorkOrderDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/work-orders/${workOrder.id}/invoice`);
      return res.json();
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice generated",
        description: `Invoice ${invoice.invoiceNumber} has been created successfully.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/work-orders/${workOrder.id}`, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Work order completed",
        description: "Work order has been marked as completed.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!workOrder) return null;

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
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount));
  };

  const canGenerateInvoice = workOrder.status === "completed" && workOrder.actualCost;
  const canMarkCompleted = workOrder.status === "in_progress";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Wrench className="h-5 w-5" />
            Work Order Details - {workOrder.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Complete details and actions for this work order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(workOrder.status)} flex items-center gap-1 text-sm px-3 py-1`}>
              {getStatusIcon(workOrder.status)}
              {formatStatus(workOrder.status)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {workOrder.priority} Priority
            </Badge>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm text-gray-900">
                    {workOrder.customer?.firstName} {workOrder.customer?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{workOrder.customer?.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{workOrder.customer?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">
                    {workOrder.customer?.address ? 
                      `${workOrder.customer.address}, ${workOrder.customer.city || ""}, ${workOrder.customer.state || ""} ${workOrder.customer.zipCode || ""}`.trim() : 
                      "Not provided"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Service Type</p>
                  <p className="text-sm text-gray-900 capitalize">
                    {workOrder.serviceType ? workOrder.serviceType.replace(/_/g, ' ') : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Priority Level</p>
                  <p className="text-sm text-gray-900 capitalize">{workOrder.priority} Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Work Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Problem Description</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{workOrder.problemDescription}</p>
              </div>
              
              {workOrder.diagnosis && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Diagnosis</p>
                  <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-md">{workOrder.diagnosis}</p>
                </div>
              )}
              
              {workOrder.repairNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Repair Notes</p>
                  <p className="text-sm text-gray-900 bg-green-50 p-3 rounded-md">{workOrder.repairNotes}</p>
                </div>
              )}

              {workOrder.assignedTechnician && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned Technician</p>
                  <p className="text-sm text-gray-900">
                    {workOrder.assignedTechnician.firstName} {workOrder.assignedTechnician.lastName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Estimated Cost</p>
                  <p className="text-sm text-gray-900 font-semibold">
                    {workOrder.estimatedCost ? formatCurrency(workOrder.estimatedCost) : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Actual Cost</p>
                  <p className="text-sm text-gray-900 font-semibold">
                    {workOrder.actualCost ? formatCurrency(workOrder.actualCost) : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Labor Hours</p>
                  <p className="text-sm text-gray-900">{workOrder.laborHours || "Not tracked"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created Date</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(workOrder.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Due Date</p>
                  <p className="text-sm text-gray-900">
                    {workOrder.dueDate ? formatDate(workOrder.dueDate) : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{formatDate(workOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDate(workOrder.updatedAt)}</p>
                </div>
                {workOrder.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-sm text-gray-900">{formatDate(workOrder.completedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {canMarkCompleted && (
              <Button
                onClick={() => markCompletedMutation.mutate()}
                disabled={markCompletedMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {markCompletedMutation.isPending ? "Marking..." : "Mark Completed"}
              </Button>
            )}
            
            {canGenerateInvoice && (
              <Button
                onClick={() => generateInvoiceMutation.mutate()}
                disabled={generateInvoiceMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {generateInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}