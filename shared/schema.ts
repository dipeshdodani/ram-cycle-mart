import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["owner", "manager", "receptionist", "technician"]);

// Work order status enum
export const workOrderStatusEnum = pgEnum("work_order_status", ["pending", "in_progress", "completed", "cancelled", "on_hold"]);

// Work order priority enum
export const workOrderPriorityEnum = pgEnum("work_order_priority", ["low", "normal", "high", "urgent"]);

// Payment status enum
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "partial", "paid", "overdue", "cancelled"]);

// Inventory type enum
export const inventoryTypeEnum = pgEnum("inventory_type", ["machine", "repairs", "parts"]);

// Users table
export const users = pgTable("users", {
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
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  gstNumber: text("gst_number"), // Optional GST number for B2B customers
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Sewing machines table
export const sewingMachines = pgTable("sewing_machines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number"),
  purchaseDate: timestamp("purchase_date"),
  warrantyExpiration: timestamp("warranty_expiration"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Work orders table
export const workOrders = pgTable("work_orders", {
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
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: inventoryTypeEnum("type").notNull().default("parts"),
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
  warrantyPeriodYears: integer("warranty_period_years").default(0), // Warranty period in years
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Work order parts table (many-to-many relationship)
export const workOrderParts = pgTable("work_order_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id),
  inventoryItemId: varchar("inventory_item_id").notNull().references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Invoice type enum
export const invoiceTypeEnum = pgEnum("invoice_type", ["service", "new_sale"]);

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  customerGstNumber: text("customer_gst_number"), // Manual GST number for this invoice
  type: invoiceTypeEnum("type").notNull().default("service"),
  items: text("items").default("[]"), // JSON array of items for new sale invoices
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull().default("0.18"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0.00"), // Amount paid so far
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull().default("0.00"), // Amount remaining
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentDate: timestamp("payment_date"),
  dueDate: timestamp("due_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Company settings table for GST configuration
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull().default("Ram Cycle Mart"),
  gstNumber: text("gst_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Shops table for multi-shop billing system
export const shops = pgTable("shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  gstin: text("gstin"),
  panNumber: text("pan_number"),
  website: text("website"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Advanced Bills table for billing system
export const advancedBills = pgTable("advanced_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: text("bill_number").notNull().unique(),
  shopId: varchar("shop_id").references(() => shops.id),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  customerGstNumber: text("customer_gst_number"),
  items: text("items").notNull(), // JSON string of items
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default('18.00'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default('0.00'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMode: text("payment_mode").notNull().default('cash'),
  billType: text("bill_type").notNull().default('gst'), // 'gst' or 'non-gst'
  warrantyNote: text("warranty_note"),
  advancePayment: decimal("advance_payment", { precision: 10, scale: 2 }).notNull().default('0.00'),
  dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Payment transactions table for tracking individual payments
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, card, upi, bank_transfer
  transactionReference: text("transaction_reference"), // for digital payments
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedWorkOrders: many(workOrders),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sewingMachines: many(sewingMachines),
  workOrders: many(workOrders),
  invoices: many(invoices),
}));

export const sewingMachinesRelations = relations(sewingMachines, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sewingMachines.customerId],
    references: [customers.id],
  }),
  workOrders: many(workOrders),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [workOrders.customerId],
    references: [customers.id],
  }),
  machine: one(sewingMachines, {
    fields: [workOrders.machineId],
    references: [sewingMachines.id],
  }),
  assignedTechnician: one(users, {
    fields: [workOrders.assignedTechnicianId],
    references: [users.id],
  }),
  parts: many(workOrderParts),
  invoices: many(invoices),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  workOrderParts: many(workOrderParts),
}));

export const workOrderPartsRelations = relations(workOrderParts, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderParts.workOrderId],
    references: [workOrders.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [workOrderParts.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  workOrder: one(workOrders, {
    fields: [invoices.workOrderId],
    references: [workOrders.id],
  }),
  paymentTransactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  invoice: one(invoices, {
    fields: [paymentTransactions.invoiceId],
    references: [invoices.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSewingMachineSchema = createInsertSchema(sewingMachines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).optional().nullable(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  cost: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  price: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) return val;
    return new Date(val);
  })
});

export const updateInvoiceSchema = z.object({
  paymentStatus: z.string().optional(),
  paymentDate: z.string().optional().nullable(),
  dueDate: z.string().optional(),
  subtotal: z.union([z.string(), z.number()]).optional(),
  taxRate: z.union([z.string(), z.number()]).optional(),
  taxAmount: z.union([z.string(), z.number()]).optional(),
  total: z.union([z.string(), z.number()]).optional(),
  paidAmount: z.union([z.string(), z.number()]).optional(),
  remainingAmount: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional().nullable(),
  items: z.string().optional(),
}).partial();

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdvancedBillSchema = createInsertSchema(advancedBills).omit({
  id: true,
  billNumber: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
});

export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type SewingMachine = typeof sewingMachines.$inferSelect;
export type InsertSewingMachine = z.infer<typeof insertSewingMachineSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

export type AdvancedBill = typeof advancedBills.$inferSelect;
export type InsertAdvancedBill = z.infer<typeof insertAdvancedBillSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type Shop = typeof shops.$inferSelect;
export type InsertShop = z.infer<typeof insertShopSchema>;
