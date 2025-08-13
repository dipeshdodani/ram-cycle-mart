var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  companySettings: () => companySettings,
  customers: () => customers,
  customersRelations: () => customersRelations,
  insertCompanySettingsSchema: () => insertCompanySettingsSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertInventoryItemSchema: () => insertInventoryItemSchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertSewingMachineSchema: () => insertSewingMachineSchema,
  insertUserSchema: () => insertUserSchema,
  insertWorkOrderSchema: () => insertWorkOrderSchema,
  inventoryItems: () => inventoryItems,
  inventoryItemsRelations: () => inventoryItemsRelations,
  invoiceTypeEnum: () => invoiceTypeEnum,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  paymentStatusEnum: () => paymentStatusEnum,
  sewingMachines: () => sewingMachines,
  sewingMachinesRelations: () => sewingMachinesRelations,
  updateInvoiceSchema: () => updateInvoiceSchema,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  workOrderParts: () => workOrderParts,
  workOrderPartsRelations: () => workOrderPartsRelations,
  workOrderPriorityEnum: () => workOrderPriorityEnum,
  workOrderStatusEnum: () => workOrderStatusEnum,
  workOrders: () => workOrders,
  workOrdersRelations: () => workOrdersRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userRoleEnum = pgEnum("user_role", ["owner", "manager", "receptionist", "technician"]);
var workOrderStatusEnum = pgEnum("work_order_status", ["pending", "in_progress", "completed", "cancelled", "on_hold"]);
var workOrderPriorityEnum = pgEnum("work_order_priority", ["low", "normal", "high", "urgent"]);
var paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue", "cancelled"]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("receptionist"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  gstNumber: text("gst_number"),
  // Optional GST number for B2B customers
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var sewingMachines = pgTable("sewing_machines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number"),
  purchaseDate: timestamp("purchase_date"),
  warrantyExpiration: timestamp("warranty_expiration"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  machineId: varchar("machine_id").references(() => sewingMachines.id),
  assignedTechnicianId: varchar("assigned_technician_id").references(() => users.id),
  problemDescription: text("problem_description").notNull(),
  diagnosis: text("diagnosis"),
  repairNotes: text("repair_notes"),
  status: workOrderStatusEnum("status").notNull().default("pending"),
  priority: workOrderPriorityEnum("priority").notNull().default("normal"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  brand: text("brand"),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var workOrderParts = pgTable("work_order_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id),
  inventoryItemId: varchar("inventory_item_id").notNull().references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var invoiceTypeEnum = pgEnum("invoice_type", ["service", "new_sale"]);
var invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  customerGstNumber: text("customer_gst_number"),
  // Manual GST number for this invoice
  type: invoiceTypeEnum("type").notNull().default("service"),
  items: text("items").default("[]"),
  // JSON array of items for new sale invoices
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull().default("0.18"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentDate: timestamp("payment_date"),
  dueDate: timestamp("due_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull().default("Ram Cycle Mart"),
  gstNumber: text("gst_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var usersRelations = relations(users, ({ many }) => ({
  assignedWorkOrders: many(workOrders)
}));
var customersRelations = relations(customers, ({ many }) => ({
  sewingMachines: many(sewingMachines),
  workOrders: many(workOrders),
  invoices: many(invoices)
}));
var sewingMachinesRelations = relations(sewingMachines, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sewingMachines.customerId],
    references: [customers.id]
  }),
  workOrders: many(workOrders)
}));
var workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [workOrders.customerId],
    references: [customers.id]
  }),
  machine: one(sewingMachines, {
    fields: [workOrders.machineId],
    references: [sewingMachines.id]
  }),
  assignedTechnician: one(users, {
    fields: [workOrders.assignedTechnicianId],
    references: [users.id]
  }),
  parts: many(workOrderParts),
  invoices: many(invoices)
}));
var inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  workOrderParts: many(workOrderParts)
}));
var workOrderPartsRelations = relations(workOrderParts, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderParts.workOrderId],
    references: [workOrders.id]
  }),
  inventoryItem: one(inventoryItems, {
    fields: [workOrderParts.inventoryItemId],
    references: [inventoryItems.id]
  })
}));
var invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id]
  }),
  workOrder: one(workOrders, {
    fields: [invoices.workOrderId],
    references: [workOrders.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSewingMachineSchema = createInsertSchema(sewingMachines).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true
}).extend({
  dueDate: z.union([z.string(), z.date()]).optional().nullable()
});
var insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  cost: z.union([z.string(), z.number()]).transform((val) => typeof val === "string" ? parseFloat(val) : val),
  price: z.union([z.string(), z.number()]).transform((val) => typeof val === "string" ? parseFloat(val) : val)
});
var insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  // Auto-generated
  createdAt: true,
  updatedAt: true
}).extend({
  dueDate: z.union([z.string(), z.date()]).transform((val) => {
    if (val instanceof Date) return val;
    return new Date(val);
  })
});
var updateInvoiceSchema = z.object({
  paymentStatus: z.string().optional(),
  paymentDate: z.string().optional().nullable(),
  dueDate: z.string().optional(),
  subtotal: z.union([z.string(), z.number()]).optional(),
  taxRate: z.union([z.string(), z.number()]).optional(),
  taxAmount: z.union([z.string(), z.number()]).optional(),
  total: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional().nullable(),
  items: z.string().optional()
}).partial();
var insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, asc, and, sql as sql2, count, sum, ilike, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, userUpdate) {
    const [updatedUser] = await db.update(users).set({ ...userUpdate, updatedAt: sql2`now()` }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async getTechnicians() {
    return await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      name: sql2`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as("name")
    }).from(users).where(eq(users.role, "technician")).orderBy(asc(users.firstName));
  }
  // Customer methods
  async getCustomers(search) {
    let query = db.select().from(customers);
    if (search) {
      query = query.where(or(
        ilike(customers.firstName, `%${search}%`),
        ilike(customers.lastName, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
        ilike(customers.email, `%${search}%`)
      ));
    }
    return await query.orderBy(desc(customers.createdAt));
  }
  async getCustomer(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || void 0;
  }
  async getCustomerByPhone(phone) {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer || void 0;
  }
  async createCustomer(customer) {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }
  async updateCustomer(id, customer) {
    const [updatedCustomer] = await db.update(customers).set({ ...customer, updatedAt: sql2`now()` }).where(eq(customers.id, id)).returning();
    return updatedCustomer;
  }
  async deleteCustomer(id) {
    const relatedWorkOrders = await db.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.customerId, id)).limit(1);
    const relatedMachines = await db.select({ id: sewingMachines.id }).from(sewingMachines).where(eq(sewingMachines.customerId, id)).limit(1);
    const relatedInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.customerId, id)).limit(1);
    if (relatedWorkOrders.length > 0) {
      throw new Error("Cannot delete customer with existing work orders. Please complete or cancel all work orders first.");
    }
    if (relatedMachines.length > 0) {
      throw new Error("Cannot delete customer with registered cycles. Please remove all cycles first.");
    }
    if (relatedInvoices.length > 0) {
      throw new Error("Cannot delete customer with existing invoices. Please remove all invoices first.");
    }
    await db.delete(customers).where(eq(customers.id, id));
  }
  // Sewing machine methods
  async getSewingMachines(customerId) {
    let query = db.select().from(sewingMachines);
    if (customerId) {
      query = query.where(eq(sewingMachines.customerId, customerId));
    }
    return await query.orderBy(desc(sewingMachines.createdAt));
  }
  async getSewingMachine(id) {
    const [machine] = await db.select().from(sewingMachines).where(eq(sewingMachines.id, id));
    return machine || void 0;
  }
  async createSewingMachine(machine) {
    const [newMachine] = await db.insert(sewingMachines).values(machine).returning();
    return newMachine;
  }
  async updateSewingMachine(id, machine) {
    const [updatedMachine] = await db.update(sewingMachines).set({ ...machine, updatedAt: sql2`now()` }).where(eq(sewingMachines.id, id)).returning();
    return updatedMachine;
  }
  async deleteSewingMachine(id) {
    await db.delete(sewingMachines).where(eq(sewingMachines.id, id));
  }
  // Work order methods
  async getWorkOrders(filters) {
    let query = db.select({
      id: workOrders.id,
      orderNumber: workOrders.orderNumber,
      problemDescription: workOrders.problemDescription,
      status: workOrders.status,
      priority: workOrders.priority,
      estimatedCost: workOrders.estimatedCost,
      actualCost: workOrders.actualCost,
      dueDate: workOrders.dueDate,
      createdAt: workOrders.createdAt,
      customer: {
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone
      },
      machine: {
        id: sewingMachines.id,
        brand: sewingMachines.brand,
        model: sewingMachines.model
      },
      technician: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName
      }
    }).from(workOrders).leftJoin(customers, eq(workOrders.customerId, customers.id)).leftJoin(sewingMachines, eq(workOrders.machineId, sewingMachines.id)).leftJoin(users, eq(workOrders.assignedTechnicianId, users.id));
    if (filters?.status) {
      query = query.where(eq(workOrders.status, filters.status));
    }
    if (filters?.customerId) {
      query = query.where(eq(workOrders.customerId, filters.customerId));
    }
    if (filters?.technicianId) {
      query = query.where(eq(workOrders.assignedTechnicianId, filters.technicianId));
    }
    return await query.orderBy(desc(workOrders.createdAt));
  }
  async getWorkOrder(id) {
    const [workOrder] = await db.select({
      id: workOrders.id,
      orderNumber: workOrders.orderNumber,
      problemDescription: workOrders.problemDescription,
      diagnosis: workOrders.diagnosis,
      repairNotes: workOrders.repairNotes,
      status: workOrders.status,
      priority: workOrders.priority,
      estimatedCost: workOrders.estimatedCost,
      actualCost: workOrders.actualCost,
      laborHours: workOrders.laborHours,
      dueDate: workOrders.dueDate,
      completedAt: workOrders.completedAt,
      createdAt: workOrders.createdAt,
      customer: {
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        email: customers.email
      },
      machine: {
        id: sewingMachines.id,
        brand: sewingMachines.brand,
        model: sewingMachines.model,
        serialNumber: sewingMachines.serialNumber
      },
      technician: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName
      }
    }).from(workOrders).leftJoin(customers, eq(workOrders.customerId, customers.id)).leftJoin(sewingMachines, eq(workOrders.machineId, sewingMachines.id)).leftJoin(users, eq(workOrders.assignedTechnicianId, users.id)).where(eq(workOrders.id, id));
    return workOrder || void 0;
  }
  async createWorkOrder(workOrder) {
    const orderNumber = `WO-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-6)}`;
    const [newWorkOrder] = await db.insert(workOrders).values({ ...workOrder, orderNumber }).returning();
    return newWorkOrder;
  }
  async updateWorkOrder(id, workOrder) {
    const updateData = { ...workOrder, updatedAt: sql2`now()` };
    if (workOrder.status === "completed" && !workOrder.completedAt) {
      updateData.completedAt = sql2`now()`;
    }
    const [updatedWorkOrder] = await db.update(workOrders).set(updateData).where(eq(workOrders.id, id)).returning();
    return updatedWorkOrder;
  }
  async deleteWorkOrder(id) {
    await db.delete(workOrders).where(eq(workOrders.id, id));
  }
  // Inventory methods
  async getInventoryItems(search) {
    let query = db.select().from(inventoryItems);
    if (search) {
      query = query.where(or(
        ilike(inventoryItems.name, `%${search}%`),
        ilike(inventoryItems.sku, `%${search}%`),
        ilike(inventoryItems.category, `%${search}%`),
        ilike(inventoryItems.brand, `%${search}%`)
      ));
    }
    return await query.orderBy(inventoryItems.name);
  }
  async getInventoryItem(id) {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || void 0;
  }
  async createInventoryItem(item) {
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }
  async updateInventoryItem(id, item) {
    const [updatedItem] = await db.update(inventoryItems).set({ ...item, updatedAt: sql2`now()` }).where(eq(inventoryItems.id, id)).returning();
    return updatedItem;
  }
  async deleteInventoryItem(id) {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }
  async getLowStockItems() {
    return await db.select().from(inventoryItems).where(sql2`${inventoryItems.quantity} <= ${inventoryItems.minimumStock}`).orderBy(inventoryItems.quantity);
  }
  // Invoice methods
  async getInvoices(filters) {
    let query = db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      workOrderId: invoices.workOrderId,
      type: invoices.type,
      items: invoices.items,
      subtotal: invoices.subtotal,
      taxRate: invoices.taxRate,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      paymentStatus: invoices.paymentStatus,
      paymentDate: invoices.paymentDate,
      dueDate: invoices.dueDate,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      customer: {
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone
      },
      workOrder: workOrders ? {
        id: workOrders.id,
        orderNumber: workOrders.orderNumber,
        problemDescription: workOrders.problemDescription
      } : null
    }).from(invoices).leftJoin(customers, eq(invoices.customerId, customers.id)).leftJoin(workOrders, eq(invoices.workOrderId, workOrders.id));
    const whereConditions = [];
    if (filters?.type) {
      whereConditions.push(eq(invoices.type, filters.type));
    }
    if (filters?.status) {
      whereConditions.push(eq(invoices.paymentStatus, filters.status));
    }
    if (whereConditions.length > 0) {
      if (whereConditions.length === 1) {
        query = query.where(whereConditions[0]);
      } else {
        query = query.where(and(...whereConditions));
      }
    }
    return await query.orderBy(desc(invoices.createdAt));
  }
  async getInvoice(id) {
    const [invoice] = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      workOrderId: invoices.workOrderId,
      type: invoices.type,
      items: invoices.items,
      subtotal: invoices.subtotal,
      taxRate: invoices.taxRate,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      paymentStatus: invoices.paymentStatus,
      paymentDate: invoices.paymentDate,
      dueDate: invoices.dueDate,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      customer: {
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        email: customers.email,
        address: customers.address
      },
      workOrder: workOrders ? {
        id: workOrders.id,
        orderNumber: workOrders.orderNumber,
        problemDescription: workOrders.problemDescription
      } : null
    }).from(invoices).leftJoin(customers, eq(invoices.customerId, customers.id)).leftJoin(workOrders, eq(invoices.workOrderId, workOrders.id)).where(eq(invoices.id, id));
    return invoice || void 0;
  }
  async createInvoice(invoice) {
    const invoiceNumber = `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-6)}`;
    const [newInvoice] = await db.insert(invoices).values({ ...invoice, invoiceNumber }).returning();
    return newInvoice;
  }
  async updateInvoice(id, invoice) {
    const transformedInvoice = { ...invoice };
    if (invoice.paymentDate) {
      transformedInvoice.paymentDate = new Date(invoice.paymentDate);
    }
    if (invoice.dueDate) {
      transformedInvoice.dueDate = new Date(invoice.dueDate);
    }
    const [updatedInvoice] = await db.update(invoices).set({ ...transformedInvoice, updatedAt: sql2`now()` }).where(eq(invoices.id, id)).returning();
    return updatedInvoice;
  }
  async deleteInvoice(id) {
    await db.delete(invoices).where(eq(invoices.id, id));
  }
  async createInvoiceFromWorkOrder(workOrderId) {
    const workOrder = await this.getWorkOrder(workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    if (workOrder.status !== "completed") {
      throw new Error("Work order must be completed to generate invoice");
    }
    if (!workOrder.actualCost) {
      throw new Error("Work order must have actual cost to generate invoice");
    }
    const subtotal = Number(workOrder.actualCost);
    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    const invoiceData = {
      customerId: workOrder.customerId,
      workOrderId,
      subtotal: subtotal.toString(),
      taxRate: taxRate.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      paymentStatus: "pending",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
      // 30 days from now
      notes: `Invoice for work order ${workOrder.orderNumber}: ${workOrder.problemDescription}`
    };
    return await this.createInvoice(invoiceData);
  }
  // Dashboard metrics
  async getDashboardMetrics() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [todaySales] = await db.select({ total: sum(invoices.total) }).from(invoices).where(and(
      eq(invoices.paymentStatus, "paid"),
      sql2`${invoices.createdAt} >= ${today}`,
      sql2`${invoices.createdAt} < ${tomorrow}`
    ));
    const [activeRepairs] = await db.select({ count: count() }).from(workOrders).where(sql2`${workOrders.status} IN ('pending', 'in_progress')`);
    const [dueToday] = await db.select({ count: count() }).from(workOrders).where(and(
      sql2`${workOrders.status} IN ('pending', 'in_progress')`,
      sql2`DATE(${workOrders.dueDate}) = DATE(${today})`
    ));
    const weekAgo = /* @__PURE__ */ new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [newCustomers] = await db.select({ count: count() }).from(customers).where(sql2`${customers.createdAt} >= ${weekAgo}`);
    const [lowStockCount] = await db.select({ count: count() }).from(inventoryItems).where(sql2`${inventoryItems.quantity} <= ${inventoryItems.minimumStock}`);
    return {
      todaySales: todaySales.total || "0",
      activeRepairs: activeRepairs.count || 0,
      dueToday: dueToday.count || 0,
      newCustomers: newCustomers.count || 0,
      lowStockItems: lowStockCount.count || 0
    };
  }
  async getRecentActivity() {
    const recentWorkOrders = await db.select({
      id: workOrders.id,
      orderNumber: workOrders.orderNumber,
      status: workOrders.status,
      dueDate: workOrders.dueDate,
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone
      },
      machine: {
        brand: sewingMachines.brand,
        model: sewingMachines.model
      }
    }).from(workOrders).leftJoin(customers, eq(workOrders.customerId, customers.id)).leftJoin(sewingMachines, eq(workOrders.machineId, sewingMachines.id)).orderBy(desc(workOrders.createdAt)).limit(5);
    const recentCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt)).limit(6);
    return {
      recentWorkOrders,
      recentCustomers
    };
  }
  // Company settings methods
  async getCompanySettings() {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings || void 0;
  }
  async createCompanySettings(settings) {
    const [newSettings] = await db.insert(companySettings).values(settings).returning();
    return newSettings;
  }
  async updateCompanySettings(id, settings) {
    const [updatedSettings] = await db.update(companySettings).set({ ...settings, updatedAt: sql2`now()` }).where(eq(companySettings.id, id)).returning();
    return updatedSettings;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
import { z as z2 } from "zod";
import { scrypt as scrypt2, randomBytes as randomBytes2 } from "crypto";
import { promisify as promisify2 } from "util";
var scryptAsync2 = promisify2(scrypt2);
async function hashPassword2(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/customers", async (req, res) => {
    try {
      const search = req.query.search;
      const customers2 = await storage.getCustomers(search);
      res.json(customers2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });
  app2.get("/api/customers/:id", async (req, res) => {
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
  app2.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid customer data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Invalid customer data" });
      }
    }
  });
  app2.put("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Failed to update customer" });
    }
  });
  app2.delete("/api/customers/:id", async (req, res) => {
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
  app2.get("/api/sewing-machines", async (req, res) => {
    try {
      const customerId = req.query.customerId;
      const machines = await storage.getSewingMachines(customerId);
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sewing machines" });
    }
  });
  app2.post("/api/sewing-machines", async (req, res) => {
    try {
      const validatedData = insertSewingMachineSchema.parse(req.body);
      const machine = await storage.createSewingMachine(validatedData);
      res.status(201).json(machine);
    } catch (error) {
      res.status(400).json({ message: "Invalid machine data" });
    }
  });
  app2.get("/api/work-orders", async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        customerId: req.query.customerId,
        technicianId: req.query.technicianId
      };
      const workOrders2 = await storage.getWorkOrders(filters);
      res.json(workOrders2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });
  app2.get("/api/work-orders/:id", async (req, res) => {
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
  app2.post("/api/work-orders", async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(workOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid work order data" });
    }
  });
  app2.put("/api/work-orders/:id", async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      res.json(workOrder);
    } catch (error) {
      console.error("Work order update error:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid work order data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to update work order" });
      }
    }
  });
  app2.patch("/api/work-orders/:id", async (req, res) => {
    try {
      console.log("PATCH work order with data:", req.body);
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      console.log("Validated data:", validatedData);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      res.json(workOrder);
    } catch (error) {
      console.error("Work order update error:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid work order data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to update work order" });
      }
    }
  });
  app2.delete("/api/work-orders/:id", async (req, res) => {
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
  app2.get("/api/inventory", async (req, res) => {
    try {
      const search = req.query.search;
      const items = await storage.getInventoryItems(search);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });
  app2.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });
  app2.post("/api/inventory", async (req, res) => {
    try {
      console.log("Inventory POST request body:", req.body);
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Inventory creation error:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid inventory item data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Invalid inventory item data" });
      }
    }
  });
  app2.put("/api/inventory/:id", async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("PUT inventory update error:", error);
      res.status(400).json({ message: "Failed to update inventory item" });
    }
  });
  app2.patch("/api/inventory/:id", async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("PATCH inventory update error:", error);
      res.status(400).json({ message: "Failed to update inventory item" });
    }
  });
  app2.get("/api/invoices", async (req, res) => {
    try {
      const customerId = req.query.customerId;
      const type = req.query.type;
      const status = req.query.status;
      const invoices2 = await storage.getInvoices({
        customerId,
        type,
        status
      });
      res.json(invoices2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/:id", async (req, res) => {
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
  app2.put("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      res.json(invoice);
    } catch (error) {
      console.error("Invoice update error:", error);
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });
  app2.delete("/api/invoices/:id", async (req, res) => {
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
  app2.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });
  app2.get("/api/dashboard/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  app2.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });
  app2.post("/api/technicians", async (req, res) => {
    try {
      console.log("Received technician data:", req.body);
      const validatedData = insertUserSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const hashedPassword = await hashPassword2(validatedData.password);
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
  app2.patch("/api/technicians/:id", async (req, res) => {
    try {
      console.log("PATCH technician with data:", req.body);
      console.log("Technician ID:", req.params.id);
      const updateData = { ...req.body };
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }
      if (!updateData.username || updateData.username.trim() === "") {
        delete updateData.username;
      }
      if (!updateData.phone || updateData.phone.trim() === "") {
        delete updateData.phone;
      }
      const validatedData = insertUserSchema.partial().parse(updateData);
      console.log("Validated data:", validatedData);
      const technician = await storage.updateUser(req.params.id, validatedData);
      res.json(technician);
    } catch (error) {
      console.error("Technician update error:", error);
      if (error instanceof z2.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({
          message: "Invalid technician data",
          errors: error.errors
        });
      } else if (error.code === "23505") {
        let message = "Failed to update technician";
        if (error.constraint === "users_username_unique") {
          message = "Username already exists. Please choose a different username.";
        } else if (error.constraint === "users_email_unique") {
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
  app2.get("/api/invoices", async (req, res) => {
    try {
      const { type, status } = req.query;
      const filters = {};
      if (type && typeof type === "string") {
        filters.type = type;
      }
      if (status && typeof status === "string") {
        filters.status = status;
      }
      const invoices2 = await storage.getInvoices(filters);
      res.json(invoices2);
    } catch (error) {
      console.error("Invoice fetch error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/:id", async (req, res) => {
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
  app2.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoiceNumber = `INV-${Date.now()}`;
      if (validatedData.type === "new_sale" && validatedData.items) {
        const items = JSON.parse(validatedData.items);
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
          const newQuantity = inventoryItem.quantity - item.quantity;
          await storage.updateInventoryItem(item.inventoryItemId, {
            quantity: newQuantity
          });
        }
      }
      const invoice = await storage.createInvoice({
        ...validatedData,
        invoiceNumber
      });
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Invoice creation error:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid invoice data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: error?.message || "Failed to create invoice" });
      }
    }
  });
  app2.put("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (error) {
      console.error("Invoice update error:", error);
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });
  app2.delete("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.type === "new_sale" && invoice.items) {
        const items = JSON.parse(invoice.items);
        for (const item of items) {
          const inventoryItem = await storage.getInventoryItem(item.inventoryItemId);
          if (inventoryItem) {
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
  app2.get("/api/company-settings", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Company settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });
  app2.post("/api/company-settings", async (req, res) => {
    try {
      const validatedData = insertCompanySettingsSchema.parse(req.body);
      const settings = await storage.createCompanySettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Company settings creation error:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid company settings data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to create company settings" });
      }
    }
  });
  app2.put("/api/company-settings/:id", async (req, res) => {
    try {
      const validatedData = insertCompanySettingsSchema.partial().parse(req.body);
      const settings = await storage.updateCompanySettings(req.params.id, validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Company settings update error:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          message: "Invalid company settings data",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Failed to update company settings" });
      }
    }
  });
  app2.post("/api/work-orders/:id/invoice", async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
