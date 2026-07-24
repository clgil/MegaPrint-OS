import * as SQLite from 'expo-sqlite';

const DB_NAME = 'megaprint.db';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
  }
  return db;
};

const initializeDatabase = async (database: SQLite.SQLiteDatabase) => {
  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');

  // Create Clients table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Inventory Parts table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS inventory_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 5,
      cost_price REAL NOT NULL,
      sale_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Service Orders table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      equipment_brand TEXT NOT NULL,
      equipment_model TEXT NOT NULL,
      equipment_serial_number TEXT,
      reported_issue TEXT NOT NULL,
      aesthetic_scratches INTEGER DEFAULT 0,
      aesthetic_dents INTEGER DEFAULT 0,
      aesthetic_missing_parts INTEGER DEFAULT 0,
      aesthetic_screen_damage INTEGER DEFAULT 0,
      aesthetic_other_damage INTEGER DEFAULT 0,
      aesthetic_notes TEXT,
      status TEXT NOT NULL DEFAULT 'RECIBIDO',
      diagnosis TEXT,
      solution_applied TEXT,
      labor_cost REAL DEFAULT 0,
      parts_cost REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivered_at DATETIME,
      customer_signature TEXT,
      technician_signature TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  // Create Parts Used table (junction table for orders and inventory)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS parts_used (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (part_id) REFERENCES inventory_parts(id),
      FOREIGN KEY (order_id) REFERENCES service_orders(id) ON DELETE CASCADE
    );
  `);

  // Create Expenses table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );
  `);

  // Create Workshop Config table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workshop_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_name TEXT NOT NULL,
      workshop_logo TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      warranty_terms TEXT,
      tax_id TEXT
    );
  `);

  // Create indexes for better performance
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_orders_status ON service_orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_client ON service_orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_parts(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  `);

  console.log('Database initialized successfully');
};

// Helper function to generate order number (MPL-1001 format)
export const generateOrderNumber = async (database: SQLite.SQLiteDatabase): Promise<string> => {
  const result = await database.getFirstAsync<{ max_id: number }>(
    'SELECT MAX(id) as max_id FROM service_orders'
  );
  const nextId = (result?.max_id || 0) + 1;
  return `MPL-${String(nextId).padStart(4, '0')}`;
};

export default {
  getDatabase,
  generateOrderNumber,
};
