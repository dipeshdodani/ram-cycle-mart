import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Wrench, Users, Package } from "lucide-react";
import type { DashboardMetrics } from "@/types";

interface MetricsCardsProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export default function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const metricItems = [
    {
      title: "Today's Sales",
      value: metrics?.todaySales ? `₹${metrics.todaySales}` : "₹0",
      icon: DollarSign,
      color: "bg-primary-100 text-primary-600",
      change: "+12.5% from yesterday",
      changeColor: "text-green-600",
    },
    {
      title: "Active Repairs",
      value: metrics?.activeRepairs?.toString() || "0",
      icon: Wrench,
      color: "bg-green-100 text-green-600",
      change: "5 due today",
      changeColor: "text-yellow-600",
    },
    {
      title: "New Customers",
      value: metrics?.newCustomers?.toString() || "0",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      change: "This week",
      changeColor: "text-blue-600",
    },
    {
      title: "Low Stock Items",
      value: metrics?.lowStockItems?.toString() || "0",
      icon: Package,
      color: "bg-orange-100 text-orange-600",
      change: "Need reorder",
      changeColor: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="ml-4 flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricItems.map((item, index) => (
        <Card key={index} className="overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">{item.title}</div>
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className={`text-sm ${item.changeColor}`}>
                  {item.change}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
