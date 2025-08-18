import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import WorkOrders from "@/pages/work-orders";
import Invoices from "@/pages/invoices";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import Technicians from "@/pages/technicians";
import UserManagement from "@/pages/users";
import AdvancedBilling from "@/pages/advanced-billing";
import WarrantyDashboard from "@/pages/warranty-dashboard";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/customers" component={Customers} />
      <ProtectedRoute path="/work-orders" component={WorkOrders} />
      <ProtectedRoute path="/technicians" component={Technicians} />
      <ProtectedRoute path="/invoices" component={Invoices} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/warranty" component={WarrantyDashboard} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/users" component={UserManagement} />
      <ProtectedRoute path="/advanced-billing" component={AdvancedBilling} />
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
