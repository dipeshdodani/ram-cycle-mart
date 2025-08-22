import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { RoleProtectedRoute } from "./lib/role-protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers-compact";
import WorkOrders from "@/pages/work-orders";
import Inventory from "@/pages/inventory-compact";
import Reports from "@/pages/reports";
import SalesReports from "@/pages/sales-reports";
import Technicians from "@/pages/technicians";
import UserManagement from "@/pages/users";
import AdvancedBilling from "@/pages/advanced-billing";
import ShopManagement from "@/pages/shop-management";
import Billing from "@/pages/billing";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/customers" component={Customers} />
      <ProtectedRoute path="/work-orders" component={WorkOrders} />
      <ProtectedRoute path="/technicians" component={Technicians} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      
      {/* Management-only pages (Owner, Manager, Receptionist) */}
      <RoleProtectedRoute 
        path="/billing" 
        component={Billing} 
        allowedRoles={["owner", "manager", "receptionist"]} 
      />
      <RoleProtectedRoute 
        path="/reports" 
        component={Reports} 
        allowedRoles={["owner", "manager", "receptionist"]} 
      />
      <RoleProtectedRoute 
        path="/sales-reports" 
        component={SalesReports} 
        allowedRoles={["owner", "manager", "receptionist"]} 
      />
      <RoleProtectedRoute 
        path="/advanced-billing" 
        component={AdvancedBilling} 
        allowedRoles={["owner", "manager", "receptionist"]} 
      />
      
      {/* Owner-only pages */}
      <RoleProtectedRoute 
        path="/users" 
        component={UserManagement} 
        allowedRoles={["owner"]} 
      />
      <RoleProtectedRoute 
        path="/shop-management" 
        component={ShopManagement} 
        allowedRoles={["owner"]} 
      />
      
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
