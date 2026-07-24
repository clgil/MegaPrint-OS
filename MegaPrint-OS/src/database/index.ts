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

  // FASE 3: Create License & Activation table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS app_license (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 0,
      license_type TEXT NOT NULL DEFAULT 'TRIAL',
      activated_at DATETIME,
      expires_at DATETIME,
      max_devices INTEGER DEFAULT 1,
      features TEXT, -- JSON array of enabled features
      workshop_name TEXT,
      email TEXT,
      device_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // FASE 3: Create App Features configuration table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS app_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_id TEXT UNIQUE NOT NULL,
      feature_name TEXT NOT NULL,
      description TEXT,
      is_enabled INTEGER DEFAULT 1,
      requires_license TEXT, -- 'TRIAL', 'BASIC', 'PRO', 'ENTERPRISE' or NULL
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    CREATE INDEX IF NOT EXISTS idx_license_active ON app_license(is_active);
    CREATE INDEX IF NOT EXISTS idx_features_enabled ON app_features(is_enabled);
  `);

  // FASE 4: Create Reports cache table for faster report generation
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS reports_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      data TEXT NOT NULL, -- JSON cached data
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );
  `);

  // FASE 4: Create Activity Log table for audit trail
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_action TEXT NOT NULL,
      entity_type TEXT, -- 'ORDER', 'CLIENT', 'INVENTORY', etc.
      entity_id INTEGER,
      old_value TEXT, -- JSON of previous state
      new_value TEXT, -- JSON of new state
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // FASE 4: Create Backup metadata table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS backup_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_path TEXT NOT NULL,
      backup_size INTEGER,
      tables_included TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_encrypted INTEGER DEFAULT 0
    );
  `);

  // Add new indexes for Phase 4
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_reports_cache_type ON reports_cache(report_type);
    CREATE INDEX IF NOT EXISTS idx_reports_cache_period ON reports_cache(period_start, period_end);
    CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);
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

  // FASE 3: Insert default trial license if not exists (30 days trial)
  const licenseCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM app_license'
  );
  
  if (!licenseCount || licenseCount.count === 0) {
    const trialExpires = new Date();
    trialExpires.setDate(trialExpires.getDate() + 30); // 30 days trial
    
    await database.runAsync(`
      INSERT INTO app_license (license_key, is_active, license_type, activated_at, expires_at, max_devices, features, workshop_name)
      VALUES (?, 1, 'TRIAL', CURRENT_TIMESTAMP, ?, 1, '["orders","clients","inventory","pdf_export","dashboard"]', 'Taller Demo')
    `, ['TRIAL-DEMO-KEY', trialExpires.toISOString().split('T')[0]]);
  }

  // FASE 3: Insert default app features configuration
  const featuresCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM app_features WHERE feature_id = "orders"'
  );
  
  if (!featuresCount || featuresCount.count === 0) {
    const defaultFeatures = [
      { id: 'orders', name: 'Gestión de Órdenes', description: 'Crear y gestionar órdenes de servicio', requiresLicense: null },
      { id: 'clients', name: 'Directorio de Clientes', description: 'CRUD de clientes e historial', requiresLicense: null },
      { id: 'inventory', name: 'Inventario', description: 'Control de repuestos y stock', requiresLicense: 'BASIC' },
      { id: 'pdf_export', name: 'Exportar PDF', description: 'Generar comprobantes y garantías', requiresLicense: null },
      { id: 'dashboard', name: 'Dashboard Financiero', description: 'Métricas y reportes financieros', requiresLicense: 'BASIC' },
      { id: 'warranty_mgmt', name: 'Gestión de Garantías', description: 'Reclamos y seguimiento de garantías', requiresLicense: 'PRO' },
      { id: 'multi_device', name: 'Multi-dispositivo', description: 'Sincronización entre dispositivos', requiresLicense: 'ENTERPRISE' },
      { id: 'custom_branding', name: 'Marca Personalizada', description: 'Logo y términos personalizados', requiresLicense: 'PRO' },
      { id: 'advanced_reports', name: 'Reportes Avanzados', description: 'Exportación avanzada de reportes', requiresLicense: 'ENTERPRISE' },
    ];
    
    for (const feature of defaultFeatures) {
      await database.runAsync(`
        INSERT INTO app_features (feature_id, feature_name, description, requires_license)
        VALUES (?, ?, ?, ?)
      `, [feature.id, feature.name, feature.description, feature.requiresLicense]);
    }
  }

  console.log('Database initialized successfully with Phase 3 tables');
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
