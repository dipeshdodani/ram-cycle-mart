import { 
  users, customers, sewingMachines, workOrders, inventoryItems, workOrderParts, invoices,
  type User, type InsertUser, type Customer, type InsertCustomer, 
  type SewingMachine, type InsertSewingMachine, type WorkOrder, type InsertWorkOrder,
  type InventoryItem, type InsertInventoryItem, type Invoice, type InsertInvoice
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql, count, sum, ilike, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  getTechnicians(): Promise<User[]>;
  
  // Customer management
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Sewing machine management
  getSewingMachines(customerId?: string): Promise<SewingMachine[]>;
  getSewingMachine(id: string): Promise<SewingMachine | undefined>;
  createSewingMachine(machine: InsertSewingMachine): Promise<SewingMachine>;
  updateSewingMachine(id: string, machine: Partial<InsertSewingMachine>): Promise<SewingMachine>;
  deleteSewingMachine(id: string): Promise<void>;
  
  // Work order management
  getWorkOrders(filters?: { status?: string; customerId?: string; technicianId?: string }): Promise<any[]>;
  getWorkOrder(id: string): Promise<any>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder>;
  deleteWorkOrder(id: string): Promise<void>;
  
  // Inventory management
  getInventoryItems(search?: string): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<void>;
  getLowStockItems(): Promise<InventoryItem[]>;
  
  // Invoice management
  getInvoices(customerId?: string): Promise<any[]>;
  getInvoice(id: string): Promise<any>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  createInvoiceFromWorkOrder(workOrderId: string): Promise<Invoice>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;
  getRecentActivity(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userUpdate, updatedAt: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getTechnicians(): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('name')
      })
      .from(users)
      .where(eq(users.role, "technician"))
      .orderBy(asc(users.firstName));
  }

  // Customer methods
  async getCustomers(search?: string): Promise<Customer[]> {
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

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: sql`now()` })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    // Check for related records first
    const relatedWorkOrders = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(eq(workOrders.customerId, id))
      .limit(1);
    
    const relatedMachines = await db
      .select({ id: sewingMachines.id })
      .from(sewingMachines)
      .where(eq(sewingMachines.customerId, id))
      .limit(1);

    const relatedInvoices = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.customerId, id))
      .limit(1);

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
  async getSewingMachines(customerId?: string): Promise<SewingMachine[]> {
    let query = db.select().from(sewingMachines);
    
    if (customerId) {
      query = query.where(eq(sewingMachines.customerId, customerId));
    }
    
    return await query.orderBy(desc(sewingMachines.createdAt));
  }

  async getSewingMachine(id: string): Promise<SewingMachine | undefined> {
    const [machine] = await db.select().from(sewingMachines).where(eq(sewingMachines.id, id));
    return machine || undefined;
  }

  async createSewingMachine(machine: InsertSewingMachine): Promise<SewingMachine> {
    const [newMachine] = await db
      .insert(sewingMachines)
      .values(machine)
      .returning();
    return newMachine;
  }

  async updateSewingMachine(id: string, machine: Partial<InsertSewingMachine>): Promise<SewingMachine> {
    const [updatedMachine] = await db
      .update(sewingMachines)
      .set({ ...machine, updatedAt: sql`now()` })
      .where(eq(sewingMachines.id, id))
      .returning();
    return updatedMachine;
  }

  async deleteSewingMachine(id: string): Promise<void> {
    await db.delete(sewingMachines).where(eq(sewingMachines.id, id));
  }

  // Work order methods
  async getWorkOrders(filters?: { status?: string; customerId?: string; technicianId?: string }): Promise<any[]> {
    let query = db
      .select({
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
          phone: customers.phone,
        },
        machine: {
          id: sewingMachines.id,
          brand: sewingMachines.brand,
          model: sewingMachines.model,
        },
        technician: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(workOrders)
      .leftJoin(customers, eq(workOrders.customerId, customers.id))
      .leftJoin(sewingMachines, eq(workOrders.machineId, sewingMachines.id))
      .leftJoin(users, eq(workOrders.assignedTechnicianId, users.id));

    if (filters?.status) {
      query = query.where(eq(workOrders.status, filters.status as any));
    }
    if (filters?.customerId) {
      query = query.where(eq(workOrders.customerId, filters.customerId));
    }
    if (filters?.technicianId) {
      query = query.where(eq(workOrders.assignedTechnicianId, filters.technicianId));
    }

    return await query.orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrder(id: string): Promise<any> {
    const [workOrder] = await db
      .select({
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
          email: customers.email,
        },
        machine: {
          id: sewingMachines.id,
          brand: sewingMachines.brand,
          model: sewingMachines.model,
          serialNumber: sewingMachines.serialNumber,
        },
        technician: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(workOrders)
      .leftJoin(customers, eq(workOrders.customerId, customers.id))
      .leftJoin(sewingMachines, eq(workOrders.machineId, sewingMachines.id))
      .leftJoin(users, eq(workOrders.assignedTechnicianId, users.id))
      .where(eq(workOrders.id, id));

    return workOrder || undefined;
  }

  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    // Generate order number
    const orderNumber = `WO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const [newWorkOrder] = await db
      .insert(workOrders)
      .values({ ...workOrder, orderNumber })
      .returning();
    return newWorkOrder;
  }

  async updateWorkOrder(id: string, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const updateData = { ...workOrder, updatedAt: sql`now()` };
    
    if (workOrder.status === 'completed' && !workOrder.completedAt) {
      updateData.completedAt = sql`now()`;
    }
    
    const [updatedWorkOrder] = await db
      .update(workOrders)
      .set(updateData)
      .where(eq(workOrders.id, id))
      .returning();
    return updatedWorkOrder;
  }

  async deleteWorkOrder(id: string): Promise<void> {
    await db.delete(workOrders).where(eq(workOrders.id, id));
  }

  // Inventory methods
  async getInventoryItems(search?: string): Promise<InventoryItem[]> {
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

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db
      .insert(inventoryItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...item, updatedAt: sql`now()` })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minimumStock}`)
      .orderBy(inventoryItems.quantity);
  }

  // Invoice methods
  async getInvoices(customerId?: string): Promise<any[]> {
    let query = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        paymentStatus: invoices.paymentStatus,
        dueDate: invoices.dueDate,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
        },
        workOrder: {
          id: workOrders.id,
          orderNumber: workOrders.orderNumber,
        },
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(workOrders, eq(invoices.workOrderId, workOrders.id));

    if (customerId) {
      query = query.where(eq(invoices.customerId, customerId));
    }

    return await query.orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<any> {
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        subtotal: invoices.subtotal,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        paymentStatus: invoices.paymentStatus,
        paymentDate: invoices.paymentDate,
        dueDate: invoices.dueDate,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
          email: customers.email,
          address: customers.address,
        },
        workOrder: {
          id: workOrders.id,
          orderNumber: workOrders.orderNumber,
          problemDescription: workOrders.problemDescription,
        },
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(workOrders, eq(invoices.workOrderId, workOrders.id))
      .where(eq(invoices.id, id));

    return invoice || undefined;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const [newInvoice] = await db
      .insert(invoices)
      .values({ ...invoice, invoiceNumber })
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: sql`now()` })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async createInvoiceFromWorkOrder(workOrderId: string): Promise<Invoice> {
    // Get the work order with customer info
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
    const taxRate = 0.08; // 8% tax rate
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoiceData: InsertInvoice = {
      customerId: workOrder.customerId,
      workOrderId: workOrderId,
      subtotal: subtotal.toString(),
      taxRate: taxRate.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      paymentStatus: "pending",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: `Invoice for work order ${workOrder.orderNumber}: ${workOrder.problemDescription}`,
    };

    return await this.createInvoice(invoiceData);
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const [todaySales] = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.paymentStatus, 'paid'),
        sql`${invoices.createdAt} >= ${today}`,
        sql`${invoices.createdAt} < ${tomorrow}`
      ));

    // Active repairs
    const [activeRepairs] = await db
      .select({ count: count() })
      .from(workOrders)
      .where(sql`${workOrders.status} IN ('pending', 'in_progress')`);

    // New customers this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [newCustomers] = await db
      .select({ count: count() })
      .from(customers)
      .where(sql`${customers.createdAt} >= ${weekAgo}`);

    // Low stock items
    const [lowStockCount] = await db
      .select({ count: count() })
      .from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minimumStock}`);

    return {
      todaySales: todaySales.total || '0',
      activeRepairs: activeRepairs.count || 0,
      newCustomers: newCustomers.count || 0,
      lowStockItems: lowStockCount.count || 0,
    };
  }

  async getRecentActivity(): Promise<any> {
    // Recent work orders
    const recentWorkOrders = await db
      .select({
        id: workOrders.id,
        orderNumber: workOrders.orderNumber,
        status: workOrders.status,
        dueDate: workOrders.dueDate,
        customer: {
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
        },
        machine: {
          brand: sewingMachines.brand,
          model: sewingMachines.model,
        },
      })
      .from(workOrders)
      .leftJoin(customers, eq(workOrders.customerId, customers.id))
      .leftJoin(sewingMachines, eq(workOrders.machineId, sewingMachines.id))
      .orderBy(desc(workOrders.createdAt))
      .limit(5);

    // Recent customers
    const recentCustomers = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(6);

    return {
      recentWorkOrders,
      recentCustomers,
    };
  }
}

export const storage = new DatabaseStorage();
