import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Wrench, Receipt, Package } from "lucide-react";
import { useLocation } from "wouter";

interface QuickActionsProps {
  onNewCustomer: () => void;
  onNewWorkOrder: () => void;
}

export default function QuickActions({ onNewCustomer, onNewWorkOrder }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "Add New Customer",
      icon: UserPlus,
      onClick: onNewCustomer,
      color: "bg-primary-600 hover:bg-primary-700",
    },
    {
      title: "Create Work Order",
      icon: Wrench,
      onClick: onNewWorkOrder,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Generate Invoice",
      icon: Receipt,
      onClick: () => setLocation("/billing"),
      color: "bg-orange-600 hover:bg-orange-700",
    },
    {
      title: "Inventory Check",
      icon: Package,
      onClick: () => setLocation("/inventory"),
      color: "bg-gray-600 hover:bg-gray-700",
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            className={`w-full text-white ${action.color} flex items-center justify-center`}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.title}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
