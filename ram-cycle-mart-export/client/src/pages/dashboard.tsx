import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RecentWorkOrders from "@/components/dashboard/recent-work-orders";
import QuickActions from "@/components/dashboard/quick-actions";
import CustomerActivity from "@/components/dashboard/customer-activity";
import { Button } from "@/components/ui/button";
import { Plus, Wrench } from "lucide-react";
import { useState } from "react";
import WorkOrderModal from "@/components/modals/work-order-modal";
import CustomerModal from "@/components/modals/customer-modal";
import type { DashboardMetrics, RecentActivity } from "@/types";

export default function Dashboard() {
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: activity, isLoading: activityLoading } = useQuery<RecentActivity>({
    queryKey: ["/api/dashboard/activity"],
  });

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        {/* Dashboard Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Shop Dashboard
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {getCurrentDate()} • 
                  <span className="text-green-600 font-medium ml-1">Shop Open</span>
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Customer
                </Button>
                <Button 
                  onClick={() => setIsWorkOrderModalOpen(true)}
                  className="bg-primary-600 hover:bg-primary-700 flex items-center"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  New Work Order
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Metrics Cards */}
          <div className="mb-8">
            <MetricsCards metrics={metrics} isLoading={metricsLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Work Orders */}
            <div className="lg:col-span-2">
              <RecentWorkOrders 
                workOrders={activity?.recentWorkOrders || []} 
                isLoading={activityLoading} 
              />
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              <QuickActions 
                onNewCustomer={() => setIsCustomerModalOpen(true)}
                onNewWorkOrder={() => setIsWorkOrderModalOpen(true)}
              />
            </div>
          </div>

          {/* Customer Activity */}
          <div className="mt-8">
            <CustomerActivity 
              customers={activity?.recentCustomers || []} 
              isLoading={activityLoading} 
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <WorkOrderModal 
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
      />
      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />
    </div>
  );
}
