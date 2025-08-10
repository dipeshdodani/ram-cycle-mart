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

  const form = useForm<InsertWorkOrder>({
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
    mutationFn: async (data: InsertWorkOrder) => {
      const res = await apiRequest("POST", "/api/work-orders", data);
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertWorkOrder) => {
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

  const onSubmit = (data: InsertWorkOrder) => {
    if (workOrder) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
                  const selectedCustomer = customers?.find((c: any) => c.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer: any) => (
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Item (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inventory item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machines?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - {item.category} (Stock: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

            <FormField
              control={form.control}
              name="estimatedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Cost</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the service or repair needed..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any internal notes..." 
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
                className="bg-primary-600 hover:bg-primary-700"
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