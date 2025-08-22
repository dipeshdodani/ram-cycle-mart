import React from "react";
import { Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";

interface RoleProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles: string[];
}

export function RoleProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
          <div className="max-w-md mx-auto pt-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.82 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Contact your administrator if you need access to this feature.
              </p>
              <button 
                onClick={() => window.history.back()} 
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                data-testid="button-go-back"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Navbar />
      <Component />
    </Route>
  );
}