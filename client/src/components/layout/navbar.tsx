import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Moon, Sun, Menu } from "lucide-react";
import { LogoWithText } from "@/components/ui/logo";
import { useTheme } from "@/hooks/use-theme";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useState } from "react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const getNavItems = () => {
    const baseItems = [
      { path: "/", label: "Dashboard" },
      { path: "/customers", label: "Customers" },
      { path: "/work-orders", label: "Work Orders" },
      { path: "/technicians", label: "Technicians" },
      { path: "/inventory", label: "Inventory" },
      { path: "/billing", label: "Billing" },
      { path: "/reports", label: "Reports" },
      { path: "/sales-reports", label: "Sales Reports" },
      { path: "/advanced-billing", label: "Advanced Billing" },
      { path: "/shop-management", label: "Shop Management" },
    ];
    
    // Add Users page for owners only
    if (user?.role === "owner") {
      baseItems.push({ path: "/users", label: "Users" });
    }
    
    return baseItems;
  };

  const navItems = getNavItems();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LogoWithText size="sm" />
            </div>
            
            {/* Hamburger Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-4">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col space-y-4 mt-6">
                  {navItems.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <span
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                          location === item.path
                            ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 p-2 ml-2">
                  <div className="text-sm text-right hidden sm:block">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 capitalize">{user?.role}</div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                      {user && getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={8} alignOffset={-8}>
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
