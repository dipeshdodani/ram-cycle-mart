-- SQLite schema for Ram Cycle Mart Desktop Application
-- This mirrors the PostgreSQL schema but adapted for SQLite

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'receptionist',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cycles table (renamed from sewing_machines)
CREATE TABLE IF NOT EXISTS cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  purchase_date TEXT,
  warranty_status TEXT DEFAULT 'unknown',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Work orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  cycle_id INTEGER,
  issue_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_technician TEXT,
  estimated_completion TEXT,
  actual_completion TEXT,
  labor_cost REAL DEFAULT 0,
  parts_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE SET NULL
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  supplier TEXT,
  minimum_stock INTEGER DEFAULT 10,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  work_order_id INTEGER,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL
);

-- Advanced bills table
CREATE TABLE IF NOT EXISTS advanced_bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  bill_number TEXT NOT NULL UNIQUE,
  bill_date TEXT NOT NULL,
  items TEXT NOT NULL, -- JSON string for item details
  subtotal REAL NOT NULL DEFAULT 0,
  gst_rate REAL DEFAULT 18,
  gst_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Session table for desktop app
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire DATETIME NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_cycles_customer_id ON cycles(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_advanced_bills_customer_id ON advanced_bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_advanced_bills_date ON advanced_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, password, role) VALUES 
(1, 'admin', '$2b$10$8K1p/a0dhrxiowP4GIpZiO', 'owner');

-- Sample data for testing (optional)
INSERT OR IGNORE INTO customers (id, name, phone, email, address) VALUES 
(1, 'राम पटेल', '9876543210', 'ram@email.com', 'પાટીદાર વાડા, અમદાવાદ');

INSERT OR IGNORE INTO inventory_items (id, name, category, quantity, unit_price, minimum_stock) VALUES 
(1, 'Chain', 'Parts', 50, 150.00, 10),
(2, 'Brake Pads', 'Parts', 30, 250.00, 5),
(3, 'Tyre Tube', 'Parts', 25, 80.00, 10);