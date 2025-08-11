import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCustomerSchema, insertSewingMachineSchema, insertWorkOrderSchema, 
  insertInventoryItemSchema, insertInvoiceSchema, insertUserSchema,
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

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const search = req.query.search as string;
      const customers = await storage.getCustomers(search);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
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

  app.post("/api/customers", async (req, res) => {
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

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
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
  app.get("/api/sewing-machines", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const machines = await storage.getSewingMachines(customerId);
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sewing machines" });
    }
  });

  app.post("/api/sewing-machines", async (req, res) => {
    try {
      const validatedData = insertSewingMachineSchema.parse(req.body);
      const machine = await storage.createSewingMachine(validatedData);
      res.status(201).json(machine);
    } catch (error) {
      res.status(400).json({ message: "Invalid machine data" });
    }
  });

  // Work order routes
  app.get("/api/work-orders", async (req, res) => {
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

  app.get("/api/work-orders/:id", async (req, res) => {
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

  app.post("/api/work-orders", async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(workOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid work order data" });
    }
  });

  app.put("/api/work-orders/:id", async (req, res) => {
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

  app.patch("/api/work-orders/:id", async (req, res) => {
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

  app.delete("/api/work-orders/:id", async (req, res) => {
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
  app.get("/api/inventory", async (req, res) => {
    try {
      const search = req.query.search as string;
      const items = await storage.getInventoryItems(search);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory item data" });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to update inventory item" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const invoices = await storage.getInvoices(customerId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      console.log("Creating invoice with data:", req.body);
      const validatedData = insertInvoiceSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Invoice creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid invoice data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Invalid invoice data" });
      }
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      res.json(invoice);
    } catch (error) {
      console.error("Invoice update error:", error);
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Invoice deletion error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to delete invoice" });
      }
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Technicians routes (users with technician role)
  app.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      console.log("Received technician data:", req.body);
      const validatedData = insertUserSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      const technicianData = { ...validatedData, password: hashedPassword };
      
      const technician = await storage.createUser(technicianData);
      res.status(201).json(technician);
    } catch (error) {
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

  app.patch("/api/technicians/:id", async (req, res) => {
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
      } else if (error.code === '23505') {
        // Handle unique constraint violations
        let message = "Failed to update technician";
        if (error.constraint === 'users_username_unique') {
          message = "Username already exists. Please choose a different username.";
        } else if (error.constraint === 'users_email_unique') {
          message = "Email already exists. Please use a different email address.";
        }
        res.status(400).json({ message });
      } else {
        res.status(400).json({ 
          message: "Failed to update technician",
          error: error.message || error.toString()
        });
      }
    }
  });

  // Enhanced Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const { type, status } = req.query;
      const filters: { type?: string; status?: string } = {};
      
      if (type && typeof type === 'string') {
        filters.type = type;
      }
      
      if (status && typeof status === 'string') {
        filters.status = status;
      }
      
      const invoices = await storage.getInvoices(filters);
      res.json(invoices);
    } catch (error) {
      console.error("Invoice fetch error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Invoice fetch error:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      // For new sale invoices, update inventory
      if (req.body.type === 'new_sale' && req.body.items) {
        const items = JSON.parse(req.body.items);
        
        // Validate and update inventory for each item
        for (const item of items) {
          const inventoryItem = await storage.getInventoryItem(item.inventoryItemId);
          if (!inventoryItem) {
            return res.status(400).json({ 
              message: `Inventory item not found: ${item.name}` 
            });
          }
          
          if (inventoryItem.quantity < item.quantity) {
            return res.status(400).json({ 
              message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Required: ${item.quantity}` 
            });
          }
          
          // Reduce inventory quantity
          await storage.updateInventoryItem(item.inventoryItemId, {
            quantity: inventoryItem.quantity - item.quantity
          });
        }
      }
      
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Invoice creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid invoice data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: error.message || "Failed to create invoice" });
      }
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      res.json(invoice);
    } catch (error) {
      console.error("Invoice update error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid invoice data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to update invoice" });
      }
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // For new sale invoices, restore inventory when deleting
      if (invoice.type === 'new_sale' && invoice.items) {
        const items = JSON.parse(invoice.items);
        
        for (const item of items) {
          const inventoryItem = await storage.getInventoryItem(item.inventoryItemId);
          if (inventoryItem) {
            // Restore inventory quantity
            await storage.updateInventoryItem(item.inventoryItemId, {
              quantity: inventoryItem.quantity + item.quantity
            });
          }
        }
      }
      
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Invoice deletion error:", error);
      res.status(400).json({ message: "Failed to delete invoice" });
    }
  });

  // Company Settings routes
  app.get("/api/company-settings", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Company settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.post("/api/company-settings", async (req, res) => {
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

  app.put("/api/company-settings/:id", async (req, res) => {
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

  // Legacy invoice generation from work order
  app.post("/api/work-orders/:id/invoice", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      
      if (workOrder.status !== "completed") {
        return res.status(400).json({ message: "Work order must be completed to generate invoice" });
      }

      const invoice = await storage.createInvoiceFromWorkOrder(req.params.id);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Failed to generate invoice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
