import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cog, Users, Wrench, FileText, Package, Star } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "receptionist" as const,
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Authentication Forms */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 flex items-center justify-center bg-primary rounded-full mr-3">
                <div className="h-8 w-8 border-2 border-white rounded-full relative">
                  <div className="absolute inset-1 border border-white rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Ram Cycle Mart</h1>
            </div>
            <p className="text-gray-600">Sewing Machine Service & Repair Shop Management System</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the shop management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-primary-custom"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Register a new user for the shop management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-firstName">First Name</Label>
                        <Input
                          id="register-firstName"
                          type="text"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-lastName">Last Name</Label>
                        <Input
                          id="register-lastName"
                          type="text"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-phone">Phone</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-role">Role</Label>
                      <Select 
                        value={registerData.role} 
                        onValueChange={(value) => setRegisterData({ ...registerData, role: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-secondary-custom"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 lg:py-8 bg-gradient-primary">
        <div className="text-white">
          <h2 className="text-4xl font-bold mb-6">
            Complete Sewing Machine Shop Management Solution
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Streamline your sewing machine sales and service operations with our all-in-one management system designed to deliver an exceptional customer experience.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold text-lg">Customer Management</h3>
                <p className="text-primary-100">Maintain detailed customer records, purchase history, and service interactions to provide personalized support and build long-lasting trust.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Wrench className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold text-lg">Sewing Machine Service Tracking</h3>
                <p className="text-primary-100">Track repairs, routine maintenance, and warranty details efficiently to ensure your customers enjoy a smooth and reliable sewing experience.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold text-lg">Billing & Invoicing</h3>
                <p className="text-primary-100">Generate accurate invoices, manage warranties, and track payments seamlessly with professional documentation.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Package className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold text-lg">Smart Inventory Management</h3>
                <p className="text-primary-100">Easily manage stock of new sewing machines, spare parts, and accessories to avoid shortages and fulfill customer needs on time.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Star className="h-8 w-8 text-primary-200" />
              <div>
                <h3 className="font-semibold text-lg">Enhanced Customer Experience</h3>
                <p className="text-primary-100">From purchase to after-sales service, we ensure every interaction is simple, transparent, and delightful for your customers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
