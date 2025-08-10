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
import Billing from "@/pages/billing";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import Technicians from "@/pages/technicians";
import AdvancedBilling from "@/pages/advanced-billing";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/customers" component={Customers} />
      <ProtectedRoute path="/work-orders" component={WorkOrders} />
      <ProtectedRoute path="/technicians" component={Technicians} />
      <ProtectedRoute path="/billing" component={Billing} />
      <ProtectedRoute path="/advanced-billing" component={AdvancedBilling} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/reports" component={Reports} />
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
