export interface DashboardMetrics {
  activeRepairs: number;
  dueToday: number;
  newCustomers: number;
  lowStockItems: number;
}

export interface RecentActivity {
  recentWorkOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    dueDate: string;
    customer: {
      firstName: string;
      lastName: string;
      phone: string;
    };
    machine: {
      brand: string;
      model: string;
    };
  }>;
  recentCustomers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    createdAt: string;
  }>;
}

export interface WorkOrderFilters {
  status?: string;
  customerId?: string;
  technicianId?: string;
}
