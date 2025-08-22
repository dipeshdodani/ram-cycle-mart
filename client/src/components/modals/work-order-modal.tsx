import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkOrderSchema, type InsertWorkOrder } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder?: any;
}

export default function WorkOrderModal({ isOpen, onClose, workOrder }: WorkOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: machines } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: technicians } = useQuery({
    queryKey: ["/api/technicians"],
  });

  const form = useForm({
    resolver: zodResolver(insertWorkOrderSchema),
    defaultValues: {
      customerId: "",
      machineId: "",
      problemDescription: "",
      priority: "normal",
      status: "pending",
      estimatedCost: "",
      actualCost: "",
      laborHours: "",
      dueDate: "",
      assignedTechnicianId: "",
    },
  });

  // Reset form when workOrder changes
  useEffect(() => {
    if (workOrder) {
      form.reset({
        customerId: workOrder.customerId,
        machineId: workOrder.machineId || "",
        problemDescription: workOrder.problemDescription,
        priority: workOrder.priority,
        status: workOrder.status,
        estimatedCost: workOrder.estimatedCost ? workOrder.estimatedCost.toString() : "",
        actualCost: workOrder.actualCost ? workOrder.actualCost.toString() : "",
        laborHours: workOrder.laborHours ? workOrder.laborHours.toString() : "",
        dueDate: workOrder.dueDate ? new Date(workOrder.dueDate).toISOString().split('T')[0] : "",
        assignedTechnicianId: workOrder.assignedTechnicianId || "",
      });
    } else {
      form.reset({
        customerId: "",
        machineId: "",
        problemDescription: "",
        priority: "normal",
        status: "pending",
        estimatedCost: "",
        actualCost: "",
        laborHours: "",
        dueDate: "",
        assignedTechnicianId: "",
      });
    }
  }, [workOrder, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending data to API:", data);
      const res = await apiRequest("POST", "/api/work-orders", data);
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.message || 'Failed to create work order');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Work order created",
        description: "Work order has been successfully created.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Create work order error:", error);
      toast({
        title: "Failed to create work order",
        description: error.message || "Please check all required fields and try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/work-orders/${workOrder.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Work order updated",
        description: "Work order has been successfully updated.",
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

  const onSubmit = (data: any) => {
    console.log("Form submission data:", data);
    
    // Transform the form data to ensure proper types
    const transformedData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
      actualCost: data.actualCost ? parseFloat(data.actualCost) : null,
      laborHours: data.laborHours ? parseFloat(data.laborHours) : null,
      assignedTechnicianId: data.assignedTechnicianId || null,
      machineId: data.machineId || null,
    };

    console.log("Transformed data:", transformedData);

    if (workOrder) {
      updateMutation.mutate(transformedData);
    } else {
      createMutation.mutate(transformedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workOrder ? "Edit Work Order" : "Create New Work Order"}
          </DialogTitle>
          <DialogDescription>
            {workOrder ? "Update work order details" : "Enter details to create a new work order"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => {
                  const selectedCustomer = Array.isArray(customers) ? customers.find((c: any) => c.id === field.value) : null;
                  return (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Select customer"} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(customers) && customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.firstName} {customer.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCustomer && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                          <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                          {selectedCustomer.phone && <p className="text-blue-700 dark:text-blue-300">📞 {selectedCustomer.phone}</p>}
                          {selectedCustomer.email && <p className="text-blue-700 dark:text-blue-300">✉️ {selectedCustomer.email}</p>}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="machineId"
                render={({ field }) => {
                  const selectedMachine = Array.isArray(machines) ? machines.find((m: any) => m.id === field.value) : null;
                  return (
                    <FormItem>
                      <FormLabel>Inventory Item (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={selectedMachine ? `${selectedMachine.name} - ${selectedMachine.category}` : "Select inventory item"} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(machines) && machines?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.category} (Stock: {item.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTechnicianId"
                render={({ field }) => {
                  const selectedTechnician = Array.isArray(technicians) ? technicians.find((t: any) => t.id === field.value) : null;
                  return (
                    <FormItem>
                      <FormLabel>Assigned Technician (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={selectedTechnician ? `${selectedTechnician.firstName} ${selectedTechnician.lastName}` : "Select technician"} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(technicians) && technicians?.map((technician: any) => (
                            <SelectItem key={technician.id} value={technician.id}>
                              {technician.firstName} {technician.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={field.value || ""} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value || ""} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="problemDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the problem reported by the customer..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {workOrder ? "Update Work Order" : "Create Work Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}