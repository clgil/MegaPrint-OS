import { getDatabase, generateOrderNumber } from './index';
import type { 
  Client, 
  ServiceOrder, 
  InventoryPart, 
  Expense, 
  WorkshopConfig,
  OrderStatus,
  AestheticState 
} from '../types';

// ==================== CLIENT REPOSITORY ====================

export const clientRepository = {
  async getAll(): Promise<Client[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Client>(
      'SELECT * FROM clients ORDER BY name ASC'
    );
    return result || [];
  },

  async getById(id: number): Promise<Client | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Client>(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );
    return result || null;
  },

  async create(client: Omit<Client, 'id' | 'createdAt'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [client.name, client.phone, client.email || null, client.address || null]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, client: Partial<Client>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (client.name) { fields.push('name = ?'); values.push(client.name); }
    if (client.phone) { fields.push('phone = ?'); values.push(client.phone); }
    if (client.email !== undefined) { fields.push('email = ?'); values.push(client.email); }
    if (client.address !== undefined) { fields.push('address = ?'); values.push(client.address); }

    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
  },

  async search(query: string): Promise<Client[]> {
    const db = await getDatabase();
    const searchTerm = `%${query}%`;
    const result = await db.getAllAsync<Client>(
      'SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC',
      [searchTerm, searchTerm]
    );
    return result || [];
  },
};

// ==================== SERVICE ORDER REPOSITORY ====================

export const serviceOrderRepository = {
  async getAll(): Promise<ServiceOrder[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<ServiceOrder>(
      `SELECT so.*, c.name as client_name 
       FROM service_orders so 
       JOIN clients c ON so.client_id = c.id 
       ORDER BY so.received_at DESC`
    );
    return this.mapResults(result);
  },

  async getById(id: number): Promise<ServiceOrder | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<ServiceOrder>(
      `SELECT so.*, c.name as client_name 
       FROM service_orders so 
       JOIN clients c ON so.client_id = c.id 
       WHERE so.id = ?`,
      [id]
    );
    return result ? this.mapResult(result) : null;
  },

  async getByStatus(status: OrderStatus): Promise<ServiceOrder[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<ServiceOrder>(
      `SELECT so.*, c.name as client_name 
       FROM service_orders so 
       JOIN clients c ON so.client_id = c.id 
       WHERE so.status = ? 
       ORDER BY so.received_at DESC`,
      [status]
    );
    return this.mapResults(result);
  },

  async create(order: {
    clientId: number;
    equipmentBrand: string;
    equipmentModel: string;
    equipmentSerialNumber?: string;
    reportedIssue: string;
    aestheticState: AestheticState;
  }): Promise<number> {
    const db = await getDatabase();
    const orderNumber = await generateOrderNumber(db);
    
    const result = await db.runAsync(
      `INSERT INTO service_orders (
        order_number, client_id, equipment_brand, equipment_model, 
        equipment_serial_number, reported_issue,
        aesthetic_scratches, aesthetic_dents, aesthetic_missing_parts,
        aesthetic_screen_damage, aesthetic_other_damage, aesthetic_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        order.clientId,
        order.equipmentBrand,
        order.equipmentModel,
        order.equipmentSerialNumber || null,
        order.reportedIssue,
        order.aestheticState.scratches ? 1 : 0,
        order.aestheticState.dents ? 1 : 0,
        order.aestheticState.missingParts ? 1 : 0,
        order.aestheticState.screenDamage ? 1 : 0,
        order.aestheticState.otherDamage ? 1 : 0,
        order.aestheticState.notes || null
      ]
    );
    return result.lastInsertRowId;
  },

  async updateStatus(id: number, status: OrderStatus): Promise<void> {
    const db = await getDatabase();
    const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [status];

    if (status === 'ENTREGADO') {
      updates.push('delivered_at = CURRENT_TIMESTAMP');
    }

    values.push(id);
    await db.runAsync(
      `UPDATE service_orders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  async updateTechnicalDetails(id: number, details: {
    diagnosis?: string;
    solutionApplied?: string;
    laborCost?: number;
    partsCost?: number;
    totalPrice?: number;
  }): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (details.diagnosis !== undefined) {
      fields.push('diagnosis = ?');
      values.push(details.diagnosis);
    }
    if (details.solutionApplied !== undefined) {
      fields.push('solution_applied = ?');
      values.push(details.solutionApplied);
    }
    if (details.laborCost !== undefined) {
      fields.push('labor_cost = ?');
      values.push(details.laborCost);
    }
    if (details.partsCost !== undefined) {
      fields.push('parts_cost = ?');
      values.push(details.partsCost);
    }
    if (details.totalPrice !== undefined) {
      fields.push('total_price = ?');
      values.push(details.totalPrice);
    }

    values.push(id);
    await db.runAsync(
      `UPDATE service_orders SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async addSignature(id: number, signatureBase64: string, isCustomer: boolean): Promise<void> {
    const db = await getDatabase();
    const field = isCustomer ? 'customer_signature' : 'technician_signature';
    await db.runAsync(
      `UPDATE service_orders SET ${field} = ? WHERE id = ?`,
      [signatureBase64, id]
    );
  },

  private mapResults(results: any[]): ServiceOrder[] {
    return (results || []).map(r => this.mapResult(r));
  },

  private mapResult(result: any): ServiceOrder {
    return {
      ...result,
      aestheticState: {
        scratches: result.aesthetic_scratches === 1,
        dents: result.aesthetic_dents === 1,
        missingParts: result.aesthetic_missing_parts === 1,
        screenDamage: result.aesthetic_screen_damage === 1,
        otherDamage: result.aesthetic_other_damage === 1,
        notes: result.aesthetic_notes,
      },
      partsUsed: [], // Will be loaded separately if needed
    };
  },
};

// ==================== INVENTORY REPOSITORY ====================

export const inventoryRepository = {
  async getAll(): Promise<InventoryPart[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<InventoryPart>(
      'SELECT * FROM inventory_parts ORDER BY name ASC'
    );
    return result || [];
  },

  async getLowStock(): Promise<InventoryPart[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<InventoryPart>(
      'SELECT * FROM inventory_parts WHERE stock_quantity <= min_stock_level ORDER BY name ASC'
    );
    return result || [];
  },

  async getById(id: number): Promise<InventoryPart | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<InventoryPart>(
      'SELECT * FROM inventory_parts WHERE id = ?',
      [id]
    );
    return result || null;
  },

  async create(part: Omit<InventoryPart, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO inventory_parts 
       (name, description, category, stock_quantity, min_stock_level, cost_price, sale_price) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        part.name,
        part.description || null,
        part.category,
        part.stockQuantity,
        part.minStockLevel,
        part.costPrice,
        part.salePrice
      ]
    );
    return result.lastInsertRowId;
  },

  async updateStock(id: number, quantityChange: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE inventory_parts 
       SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [quantityChange, id]
    );
  },

  async update(id: number, part: Partial<InventoryPart>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (part.name) { fields.push('name = ?'); values.push(part.name); }
    if (part.description !== undefined) { fields.push('description = ?'); values.push(part.description); }
    if (part.category) { fields.push('category = ?'); values.push(part.category); }
    if (part.stockQuantity !== undefined) { fields.push('stock_quantity = ?'); values.push(part.stockQuantity); }
    if (part.minStockLevel !== undefined) { fields.push('min_stock_level = ?'); values.push(part.minStockLevel); }
    if (part.costPrice !== undefined) { fields.push('cost_price = ?'); values.push(part.costPrice); }
    if (part.salePrice !== undefined) { fields.push('sale_price = ?'); values.push(part.salePrice); }

    values.push(id);
    await db.runAsync(
      `UPDATE inventory_parts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM inventory_parts WHERE id = ?', [id]);
  },
};

// ==================== EXPENSE REPOSITORY ====================

export const expenseRepository = {
  async getAll(): Promise<Expense[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Expense>(
      'SELECT * FROM expenses ORDER BY date DESC'
    );
    return result || [];
  },

  async getByMonth(year: number, month: number): Promise<Expense[]> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await db.getAllAsync<Expense>(
      'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return result || [];
  },

  async create(expense: Omit<Expense, 'id'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO expenses (description, category, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
      [
        expense.description,
        expense.category,
        expense.amount,
        expense.date,
        expense.notes || null
      ]
    );
    return result.lastInsertRowId;
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  },
};

// ==================== WORKSHOP CONFIG REPOSITORY ====================

export const workshopConfigRepository = {
  async getConfig(): Promise<WorkshopConfig | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<WorkshopConfig>(
      'SELECT * FROM workshop_config LIMIT 1'
    );
    return result || null;
  },

  async updateOrCreate(config: Partial<WorkshopConfig>): Promise<number> {
    const db = await getDatabase();
    const existing = await this.getConfig();

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];

      if (config.workshopName !== undefined) { fields.push('workshop_name = ?'); values.push(config.workshopName); }
      if (config.workshopLogo !== undefined) { fields.push('workshop_logo = ?'); values.push(config.workshopLogo); }
      if (config.address !== undefined) { fields.push('address = ?'); values.push(config.address); }
      if (config.phone !== undefined) { fields.push('phone = ?'); values.push(config.phone); }
      if (config.email !== undefined) { fields.push('email = ?'); values.push(config.email); }
      if (config.warrantyTerms !== undefined) { fields.push('warranty_terms = ?'); values.push(config.warrantyTerms); }
      if (config.taxId !== undefined) { fields.push('tax_id = ?'); values.push(config.taxId); }

      if (fields.length > 0) {
        values.push(existing.id);
        await db.runAsync(
          `UPDATE workshop_config SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
        return existing.id;
      }
      return existing.id;
    } else {
      const result = await db.runAsync(
        `INSERT INTO workshop_config 
         (workshop_name, workshop_logo, address, phone, email, warranty_terms, tax_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          config.workshopName || '',
          config.workshopLogo || null,
          config.address || null,
          config.phone || null,
          config.email || null,
          config.warrantyTerms || null,
          config.taxId || null
        ]
      );
      return result.lastInsertRowId;
    }
  },
};
