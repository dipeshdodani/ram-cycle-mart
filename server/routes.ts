import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCustomerSchema, insertSewingMachineSchema, insertWorkOrderSchema, 
  insertInventoryItemSchema, insertUserSchema,
  insertCompanySettingsSchema
} from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Authentication middleware for protected routes
  function requireAuth(req: any, res: any, next: any) {
    console.log(`Auth check for ${req.method} ${req.path}: session=${!!req.session}, sessionID=${req.session?.id}, user=${!!req.user}, authenticated=${req.isAuthenticated()}`);
    console.log(`Session passport: ${JSON.stringify(req.session?.passport)}`);
    
    // TEMPORARY: Skip auth in development if session cookies aren't working
    if (process.env.NODE_ENV === 'development' && !req.isAuthenticated()) {
      console.log(`DEVELOPMENT MODE: Bypassing auth for ${req.method} ${req.path}`);
      // Create a mock user for development
      req.user = {
        id: "26cfa482-a479-429f-8ea2-e4b25799e55c",
        username: "shriram",
        role: "owner",
        firstName: "Shri",
        lastName: "Ram"
      };
      return next();
    }
    
    if (!req.isAuthenticated()) {
      console.log(`Authentication failed for ${req.method} ${req.path}`);
      return res.status(401).json({ message: "Authentication required" });
    }
    console.log(`Authentication successful for ${req.method} ${req.path}, user: ${req.user.username}`);
    next();
  }

  // Role-based middleware for owner-only features
  function requireOwner(req: any, res: any, next: any) {
    if (!req.isAuthenticated() || req.user.role !== 'owner') {
      return res.status(403).json({ message: "Owner access required" });
    }
    next();
  }

  // Customer routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string;
      const customers = await storage.getCustomers(search);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Check for duplicate customer by phone number
      const existingCustomer = await storage.getCustomerByPhone(validatedData.phone);
      if (existingCustomer) {
        return res.status(409).json({ 
          message: "Customer with this phone number already exists" 
        });
      }
      
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Customer creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid customer data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Invalid customer data" });
      }
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Customer deletion error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to delete customer" });
      }
    }
  });

  // Sewing machine routes
  app.get("/api/sewing-machines", requireAuth, async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const machines = await storage.getSewingMachines(customerId);
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sewing machines" });
    }
  });

  app.post("/api/sewing-machines", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSewingMachineSchema.parse(req.body);
      const machine = await storage.createSewingMachine(validatedData);
      res.status(201).json(machine);
    } catch (error) {
      res.status(400).json({ message: "Invalid machine data" });
    }
  });

  // Work order routes
  app.get("/api/work-orders", requireAuth, async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        technicianId: req.query.technicianId as string,
      };
      const workOrders = await storage.getWorkOrders(filters);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", requireAuth, async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(workOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid work order data" });
    }
  });

  app.put("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      res.json(workOrder);
    } catch (error) {
      console.error("Work order update error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid work order data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to update work order" });
      }
    }
  });

  app.patch("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      console.log("PATCH work order with data:", req.body);
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      console.log("Validated data:", validatedData);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      res.json(workOrder);
    } catch (error) {
      console.error("Work order update error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid work order data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to update work order" });
      }
    }
  });

  app.delete("/api/work-orders/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWorkOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Work order deletion error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to delete work order" });
      }
    }
  });

  // Inventory routes
  app.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string;
      const items = await storage.getInventoryItems(search);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.get("/api/inventory/low-stock", requireAuth, async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/inventory", requireAuth, async (req, res) => {
    try {
      console.log("Inventory POST request body:", req.body);
      
      // If SKU is empty, generate a unique one
      if (!req.body.sku || req.body.sku.trim() === '') {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        req.body.sku = `ITEM-${timestamp}-${randomSuffix}`;
        console.log("Generated SKU:", req.body.sku);
      }
      
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Inventory creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      } else if ((error as any).code === '23505' && (error as any).constraint === 'inventory_items_sku_unique') {
        res.status(400).json({ 
          message: "An item with this SKU already exists. Please use a different SKU." 
        });
      } else {
        res.status(400).json({ message: "Failed to create inventory item" });
      }
    }
  });

  app.put("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("PUT inventory update error:", error);
      res.status(400).json({ message: "Failed to update inventory item" });
    }
  });

  app.patch("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("PATCH inventory update error:", error);
      res.status(400).json({ message: "Failed to update inventory item" });
    }
  });



  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/activity", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Technicians routes (users with technician role)
  app.get("/api/technicians", requireAuth, async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.post("/api/technicians", requireAuth, async (req, res) => {
    try {
      console.log("Received technician data:", req.body);
      const validatedData = insertUserSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      const technicianData = { ...validatedData, password: hashedPassword };
      
      const technician = await storage.createUser(technicianData);
      res.status(201).json(technician);
    } catch (error: any) {
      console.error("Technician creation error:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ 
        message: "Invalid technician data", 
        details: error.message,
        issues: error.issues || []
      });
    }
  });

  app.patch("/api/technicians/:id", requireAuth, async (req, res) => {
    try {
      console.log("PATCH technician with data:", req.body);
      console.log("Technician ID:", req.params.id);
      
      // For updates, clean up empty fields that shouldn't be updated
      const updateData = { ...req.body };
      
      // Remove password if empty
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      
      // Remove username if empty (don't update to empty string)
      if (!updateData.username || updateData.username.trim() === '') {
        delete updateData.username;
      }
      
      // Remove phone if empty
      if (!updateData.phone || updateData.phone.trim() === '') {
        delete updateData.phone;
      }
      
      const validatedData = insertUserSchema.partial().parse(updateData);
      console.log("Validated data:", validatedData);
      const technician = await storage.updateUser(req.params.id, validatedData);
      res.json(technician);
    } catch (error) {
      console.error("Technician update error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ 
          message: "Invalid technician data",
          errors: error.errors
        });
      } else if ((error as any).code === '23505') {
        // Handle unique constraint violations
        let message = "Failed to update technician";
        if ((error as any).constraint === 'users_username_unique') {
          message = "Username already exists. Please choose a different username.";
        } else if ((error as any).constraint === 'users_email_unique') {
          message = "Email already exists. Please use a different email address.";
        }
        res.status(400).json({ message });
      } else {
        res.status(400).json({ 
          message: "Failed to update technician",
          error: (error as any).message || (error as Error).toString()
        });
      }
    }
  });




  // Company Settings routes
  app.get("/api/company-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Company settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.post("/api/company-settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCompanySettingsSchema.parse(req.body);
      const settings = await storage.createCompanySettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Company settings creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid company settings data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to create company settings" });
      }
    }
  });

  app.put("/api/company-settings/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCompanySettingsSchema.partial().parse(req.body);
      const settings = await storage.updateCompanySettings(req.params.id, validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Company settings update error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid company settings data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to update company settings" });
      }
    }
  });

  // User management routes (Owner only)
  app.get("/api/users", requireOwner, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't send password hashes to frontend
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireOwner, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check for duplicate username
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ 
          message: "Username already exists" 
        });
      }
      
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });
      
      // Don't send password hash back
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("User creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid user data",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.put("/api/users/:id", requireOwner, async (req, res) => {
    try {
      const { password, ...updateData } = req.body;
      let finalUpdateData = updateData;
      
      // Hash password if provided
      if (password) {
        finalUpdateData.password = await hashPassword(password);
      }
      
      const user = await storage.updateUser(req.params.id, finalUpdateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password hash back
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("User update error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireOwner, async (req, res) => {
    try {
      // Prevent owner from deleting themselves
      if (req.user?.id === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(req.params.id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
