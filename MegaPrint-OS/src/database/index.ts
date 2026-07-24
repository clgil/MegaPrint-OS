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
      warranty_until DATETIME,
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

  // FASE 2: Create Incomes table (separada de expenses para mejor tracking)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_id INTEGER,
      payment_method TEXT,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES service_orders(id)
    );
  `);

  // FASE 2: Enhanced Expenses table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT,
      notes TEXT,
      receipt_image TEXT
    );
  `);

  // FASE 2: Create Warranty Claims table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS warranty_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      claim_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT NOT NULL,
      resolution TEXT,
      status TEXT NOT NULL DEFAULT 'PENDIENTE',
      resolved_at DATETIME,
      cost_to_workshop REAL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES service_orders(id)
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
      warranty_days INTEGER DEFAULT 30,
      tax_id TEXT,
      currency_symbol TEXT DEFAULT '$'
    );
  `);

  // Create indexes for better performance
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_orders_status ON service_orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_client ON service_orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_parts(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
    CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);
    CREATE INDEX IF NOT EXISTS idx_orders_warranty ON service_orders(warranty_until);
  `);

  // FASE 2: Insert default workshop config if not exists
  const configCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workshop_config'
  );
  
  if (!configCount || configCount.count === 0) {
    await database.runAsync(`
      INSERT INTO workshop_config (workshop_name, warranty_terms, warranty_days, currency_symbol)
      VALUES ('Mi Taller de Hardware', 'Garantía de 30 días por defectos de fabricación o instalación. La garantía no cubre mal uso, golpes, líquidos o manipulaciones por terceros.', 30, '$')
    `);
  }

  console.log('Database initialized successfully with Phase 2 tables');
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
