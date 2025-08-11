import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Moon, Sun } from "lucide-react";
import { LogoWithText } from "@/components/ui/logo";
import { useTheme } from "@/hooks/use-theme";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/customers", label: "Customers" },
    { path: "/work-orders", label: "Work Orders" },
    { path: "/technicians", label: "Technicians" },
    { path: "/invoices", label: "Invoices" },
    { path: "/inventory", label: "Inventory" },
    { path: "/reports", label: "Reports" },
  ];

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
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`px-1 pt-1 pb-4 text-sm font-medium border-b-2 transition-colors ${
                      location === item.path
                        ? "text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 p-2">
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
              <DropdownMenuContent align="end">
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
