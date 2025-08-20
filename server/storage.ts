import { 
  users, customers, sewingMachines, workOrders, inventoryItems, workOrderParts, companySettings,
  type User, type InsertUser, type Customer, type InsertCustomer, 
  type SewingMachine, type InsertSewingMachine, type WorkOrder, type InsertWorkOrder,
  type InventoryItem, type InsertInventoryItem,
  type CompanySettings, type InsertCompanySettings
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
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
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
  

  
  // Company settings
  getCompanySettings(): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(id: string, settings: Partial<InsertCompanySettings>): Promise<CompanySettings>;

  
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
    try {
      console.log(`Storage.getUser called with ID: ${id}`);
      const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log(`Storage.getUser result: ${user ? `${user.username} (${user.firstName} ${user.lastName})` : 'null'}`);
      return user || undefined;
    } catch (error) {
      console.error(`Storage.getUser error for ID ${id}:`, error);
      return undefined;
    }
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName));
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

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getTechnicians(): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
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





  // Dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active repairs (pending and in_progress)
    const [activeRepairs] = await db
      .select({ count: count() })
      .from(workOrders)
      .where(sql`${workOrders.status} IN ('pending', 'in_progress')`);

    // Work orders due today
    const [dueToday] = await db
      .select({ count: count() })
      .from(workOrders)
      .where(and(
        sql`${workOrders.status} IN ('pending', 'in_progress')`,
        sql`DATE(${workOrders.dueDate}) = DATE(${today})`
      ));

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
      activeRepairs: activeRepairs.count || 0,
      dueToday: dueToday.count || 0,
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

  // Company settings methods
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db
      .select()
      .from(companySettings)
      .limit(1);
    return settings || undefined;
  }

  async createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const [newSettings] = await db
      .insert(companySettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateCompanySettings(id: string, settings: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const [updatedSettings] = await db
      .update(companySettings)
      .set({ ...settings, updatedAt: sql`now()` })
      .where(eq(companySettings.id, id))
      .returning();
    return updatedSettings;
  }




}

export const storage = new DatabaseStorage();
