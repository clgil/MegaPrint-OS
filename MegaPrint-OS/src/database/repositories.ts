import { getDatabase, generateOrderNumber } from './index';
import type { 
  Client, 
  ServiceOrder, 
  InventoryPart, 
  Expense, 
  Income,
  WorkshopConfig,
  OrderStatus,
  AestheticState,
  WarrantyClaim,
  WarrantyStatus,
  MonthlyFinancialSummary,
  DailyFinancialSummary,
  PaymentMethod,
  ExpenseCategory,
  IncomeCategory,
  LicenseInfo,
  LicenseType,
  ActivationRequest,
  ActivationResponse,
  AppFeature
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

  mapResults(results: any[]): ServiceOrder[] {
    return (results || []).map(r => this.mapResult(r));
  },

  mapResult(result: any): ServiceOrder {
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

// ==================== EXPENSE REPOSITORY (FASE 2) ====================

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

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Expense>(
      'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return result || [];
  },

  async create(expense: Omit<Expense, 'id'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO expenses (description, category, amount, date, payment_method, notes, receipt_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        expense.description,
        expense.category,
        expense.amount,
        expense.date,
        expense.paymentMethod || null,
        expense.notes || null,
        expense.receiptImage || null
      ]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, expense: Partial<Expense>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (expense.description !== undefined) { fields.push('description = ?'); values.push(expense.description); }
    if (expense.category !== undefined) { fields.push('category = ?'); values.push(expense.category); }
    if (expense.amount !== undefined) { fields.push('amount = ?'); values.push(expense.amount); }
    if (expense.paymentMethod !== undefined) { fields.push('payment_method = ?'); values.push(expense.paymentMethod); }
    if (expense.notes !== undefined) { fields.push('notes = ?'); values.push(expense.notes); }
    if (expense.receiptImage !== undefined) { fields.push('receipt_image = ?'); values.push(expense.receiptImage); }

    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  },

  async getTotalByMonth(year: number, month: number): Promise<number> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );
    return result?.total || 0;
  },

  async getTotalByCategory(year: number, month: number): Promise<{ category: string; total: number }[]> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await db.getAllAsync<{ category: string; total: number }>(
      `SELECT category, SUM(amount) as total 
       FROM expenses 
       WHERE date BETWEEN ? AND ? 
       GROUP BY category 
       ORDER BY total DESC`,
      [startDate, endDate]
    );
    return result || [];
  },
};

// ==================== INCOME REPOSITORY (FASE 2) ====================

export const incomeRepository = {
  async getAll(): Promise<Income[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Income>(
      'SELECT * FROM incomes ORDER BY date DESC'
    );
    return result || [];
  },

  async getByMonth(year: number, month: number): Promise<Income[]> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await db.getAllAsync<Income>(
      'SELECT * FROM incomes WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return result || [];
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Income>(
      'SELECT * FROM incomes WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return result || [];
  },

  async create(income: Omit<Income, 'id'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO incomes (description, category, amount, date, order_id, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        income.description,
        income.category,
        income.amount,
        income.date,
        income.orderId || null,
        income.paymentMethod || null,
        income.notes || null
      ]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, income: Partial<Income>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (income.description !== undefined) { fields.push('description = ?'); values.push(income.description); }
    if (income.category !== undefined) { fields.push('category = ?'); values.push(income.category); }
    if (income.amount !== undefined) { fields.push('amount = ?'); values.push(income.amount); }
    if (income.paymentMethod !== undefined) { fields.push('payment_method = ?'); values.push(income.paymentMethod); }
    if (income.notes !== undefined) { fields.push('notes = ?'); values.push(income.notes); }

    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE incomes SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM incomes WHERE id = ?', [id]);
  },

  async getTotalByMonth(year: number, month: number): Promise<number> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );
    return result?.total || 0;
  },

  async getTotalByCategory(year: number, month: number): Promise<{ category: string; total: number }[]> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = await db.getAllAsync<{ category: string; total: number }>(
      `SELECT category, SUM(amount) as total 
       FROM incomes 
       WHERE date BETWEEN ? AND ? 
       GROUP BY category 
       ORDER BY total DESC`,
      [startDate, endDate]
    );
    return result || [];
  },
};

// ==================== WARRANTY CLAIMS REPOSITORY (FASE 2) ====================

export const warrantyClaimRepository = {
  async getAll(): Promise<WarrantyClaim[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<WarrantyClaim>(
      'SELECT * FROM warranty_claims ORDER BY claim_date DESC'
    );
    return result || [];
  },

  async getByOrderId(orderId: number): Promise<WarrantyClaim[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<WarrantyClaim>(
      'SELECT * FROM warranty_claims WHERE order_id = ? ORDER BY claim_date DESC',
      [orderId]
    );
    return result || [];
  },

  async getByStatus(status: WarrantyStatus): Promise<WarrantyClaim[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<WarrantyClaim>(
      'SELECT * FROM warranty_claims WHERE status = ? ORDER BY claim_date DESC',
      [status]
    );
    return result || [];
  },

  async getPendingClaims(): Promise<WarrantyClaim[]> {
    return this.getByStatus('PENDIENTE');
  },

  async create(claim: Omit<WarrantyClaim, 'id'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO warranty_claims (order_id, claim_date, description, status, cost_to_workshop) VALUES (?, ?, ?, ?, ?)',
      [
        claim.orderId,
        claim.claimDate,
        claim.description,
        claim.status,
        claim.costToWorkshop || 0
      ]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, claim: Partial<WarrantyClaim>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (claim.description !== undefined) { fields.push('description = ?'); values.push(claim.description); }
    if (claim.resolution !== undefined) { fields.push('resolution = ?'); values.push(claim.resolution); }
    if (claim.status !== undefined) { fields.push('status = ?'); values.push(claim.status); }
    if (claim.costToWorkshop !== undefined) { fields.push('cost_to_workshop = ?'); values.push(claim.costToWorkshop); }
    if (claim.resolvedAt !== undefined) { fields.push('resolved_at = ?'); values.push(claim.resolvedAt); }

    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE warranty_claims SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async resolve(id: number, resolution: string, costToWorkshop: number = 0): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE warranty_claims 
       SET resolution = ?, status = 'RESUELTO', resolved_at = CURRENT_TIMESTAMP, cost_to_workshop = ? 
       WHERE id = ?`,
      [resolution, costToWorkshop, id]
    );
  },

  async reject(id: number, resolution: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE warranty_claims 
       SET resolution = ?, status = 'RECHAZADO', resolved_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [resolution, id]
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM warranty_claims WHERE id = ?', [id]);
  },
};

// ==================== FINANCIAL DASHBOARD REPOSITORY (FASE 2) ====================

export const financialRepository = {
  async getMonthlySummary(year: number, month: number): Promise<MonthlyFinancialSummary> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    // Get total income
    const incomeResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );

    // Get total expenses
    const expenseResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );

    // Get service count
    const serviceResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM service_orders WHERE delivered_at BETWEEN ? AND ?',
      [startDate, endDate]
    );

    // Get total revenue from delivered orders
    const revenueResult = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(total_price), 0) as total FROM service_orders WHERE delivered_at BETWEEN ? AND ?',
      [startDate, endDate]
    );

    const totalIncome = (incomeResult?.total || 0) + (revenueResult?.total || 0);
    const totalExpenses = expenseResult?.total || 0;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const serviceCount = serviceResult?.count || 0;
    const averageTicket = serviceCount > 0 ? totalIncome / serviceCount : 0;

    return {
      month,
      year,
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      serviceCount,
      averageTicket,
    };
  },

  async getDailySummaries(year: number, month: number): Promise<DailyFinancialSummary[]> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    // This is a simplified version - in production you'd want to aggregate by day
    const result = await db.getAllAsync<DailyFinancialSummary>(
      `SELECT 
         DATE(date) as date,
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
         COUNT(*) as transactionCount
       FROM (
         SELECT date, amount, 'income' as type FROM incomes WHERE date BETWEEN ? AND ?
         UNION ALL
         SELECT date, amount, 'expense' as type FROM expenses WHERE date BETWEEN ? AND ?
       )
       GROUP BY DATE(date)
       ORDER BY date`,
      [startDate, endDate, startDate, endDate]
    );

    return result || [];
  },

  async compareMonths(currentYear: number, currentMonth: number, previousYear: number, previousMonth: number): Promise<{
    current: MonthlyFinancialSummary;
    previous: MonthlyFinancialSummary;
    growthPercentage: number;
  }> {
    const current = await this.getMonthlySummary(currentYear, currentMonth);
    const previous = await this.getMonthlySummary(previousYear, previousMonth);
    
    const growthPercentage = previous.netProfit > 0 
      ? ((current.netProfit - previous.netProfit) / previous.netProfit) * 100 
      : 0;

    return { current, previous, growthPercentage };
  },

  async getTopServices(year: number, month: number, limit: number = 5): Promise<{ name: string; count: number; revenue: number }[]> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    // Group by equipment brand (simplified - in production you might categorize services differently)
    const result = await db.getAllAsync<{ name: string; count: number; revenue: number }>(
      `SELECT 
         equipment_brand as name,
         COUNT(*) as count,
         SUM(total_price) as revenue
       FROM service_orders
       WHERE delivered_at BETWEEN ? AND ?
       GROUP BY equipment_brand
       ORDER BY revenue DESC
       LIMIT ?`,
      [startDate, endDate, limit]
    );

    return result || [];
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

// ==================== LICENSE & ACTIVATION REPOSITORY (FASE 3) ====================

export const licenseRepository = {
  async getCurrentLicense(): Promise<LicenseInfo | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM app_license WHERE is_active = 1 LIMIT 1'
    );
    
    if (!result) return null;
    
    return {
      licenseKey: result.license_key,
      isActive: result.is_active === 1,
      licenseType: result.license_type as LicenseType,
      activatedAt: result.activated_at,
      expiresAt: result.expires_at,
      maxDevices: result.max_devices,
      features: result.features ? JSON.parse(result.features) : [],
      workshopName: result.workshop_name,
      email: result.email,
    };
  },

  async activateLicense(request: ActivationRequest): Promise<ActivationResponse> {
    const db = await getDatabase();
    
    // Simulación de validación offline (en producción esto validaría con un servidor)
    // Formato de clave: XXXX-XXXX-XXXX-XXXX o TRIAL-DEMO-KEY
    const isValidFormat = /^([A-Z0-9]{4}-){2,3}[A-Z0-9]{4}$/.test(request.licenseKey) || 
                          request.licenseKey === 'TRIAL-DEMO-KEY';
    
    if (!isValidFormat) {
      return { success: false, message: 'Clave de licencia inválida', error: 'FORMAT_ERROR' };
    }

    try {
      // Determinar tipo de licencia basado en la clave
      let licenseType: LicenseType = 'BASIC';
      let features = ['orders', 'clients', 'inventory', 'pdf_export'];
      let maxDevices = 1;
      let expiresAt: string | null = null;

      if (request.licenseKey.includes('TRIAL')) {
        licenseType = 'TRIAL';
        features = ['orders', 'clients', 'inventory', 'pdf_export', 'dashboard'];
        const trialDate = new Date();
        trialDate.setDate(trialDate.getDate() + 30);
        expiresAt = trialDate.toISOString().split('T')[0];
      } else if (request.licenseKey.includes('PRO')) {
        licenseType = 'PRO';
        features = ['orders', 'clients', 'inventory', 'pdf_export', 'dashboard', 'warranty_mgmt', 'custom_branding'];
        maxDevices = 3;
        const proDate = new Date();
        proDate.setFullYear(proDate.getFullYear() + 1);
        expiresAt = proDate.toISOString().split('T')[0];
      } else if (request.licenseKey.includes('ENT')) {
        licenseType = 'ENTERPRISE';
        features = ['orders', 'clients', 'inventory', 'pdf_export', 'dashboard', 'warranty_mgmt', 'custom_branding', 'multi_device', 'advanced_reports'];
        maxDevices = 10;
        const entDate = new Date();
        entDate.setFullYear(entDate.getFullYear() + 1);
        expiresAt = entDate.toISOString().split('T')[0];
      }

      // Verificar si ya existe una licencia activa
      const existing = await this.getCurrentLicense();
      
      if (existing && existing.isActive) {
        // Desactivar licencia anterior
        await db.runAsync('UPDATE app_license SET is_active = 0 WHERE is_active = 1');
      }

      // Insertar nueva licencia
      await db.runAsync(
        `INSERT INTO app_license 
         (license_key, is_active, license_type, activated_at, expires_at, max_devices, features, workshop_name, email, device_id)
         VALUES (?, 1, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)`,
        [
          request.licenseKey,
          licenseType,
          expiresAt,
          maxDevices,
          JSON.stringify(features),
          request.workshopName,
          request.email,
          request.deviceId
        ]
      );

      return {
        success: true,
        message: `Licencia ${licenseType} activada exitosamente`,
        licenseInfo: {
          licenseKey: request.licenseKey,
          isActive: true,
          licenseType,
          activatedAt: new Date().toISOString(),
          expiresAt: expiresAt || undefined,
          maxDevices,
          features,
          workshopName: request.workshopName,
          email: request.email,
        }
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: 'Error al activar la licencia', 
        error: error.message 
      };
    }
  },

  async deactivateLicense(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE app_license SET is_active = 0 WHERE is_active = 1');
  },

  async isFeatureEnabled(featureId: string): Promise<boolean> {
    const db = await getDatabase();
    
    // Verificar si la feature existe y está habilitada
    const feature = await db.getFirstAsync<{ is_enabled: number; requires_license: string | null }>(
      'SELECT is_enabled, requires_license FROM app_features WHERE feature_id = ?',
      [featureId]
    );
    
    if (!feature) return false;
    if (feature.is_enabled === 0) return false;
    
    // Si no requiere licencia, está disponible
    if (!feature.requires_license) return true;
    
    // Verificar si el usuario tiene la licencia requerida
    const license = await this.getCurrentLicense();
    if (!license || !license.isActive) return false;
    
    // Verificar jerarquía de licencias
    const licenseHierarchy: Record<LicenseType, number> = {
      'TRIAL': 1,
      'BASIC': 2,
      'PRO': 3,
      'ENTERPRISE': 4
    };
    
    const requiredLevel = licenseHierarchy[feature.requires_license as LicenseType];
    const userLevel = licenseHierarchy[license.licenseType];
    
    return userLevel >= requiredLevel;
  },

  async getAllFeatures(): Promise<AppFeature[]> {
    const db = await getDatabase();
    const license = await this.getCurrentLicense();
    
    const results = await db.getAllAsync<any>(
      'SELECT * FROM app_features ORDER BY id'
    );
    
    return results.map((r: any) => ({
      id: r.feature_id,
      name: r.feature_name,
      description: r.description,
      enabled: r.is_enabled === 1 && (!r.requires_license || license?.isActive),
      requiresLicense: r.requires_license as LicenseType | null,
    }));
  },

  async updateFeature(featureId: string, isEnabled: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE app_features SET is_enabled = ? WHERE feature_id = ?',
      [isEnabled ? 1 : 0, featureId]
    );
  },

  async checkLicenseExpiration(): Promise<{ isExpired: boolean; daysRemaining: number }> {
    const license = await this.getCurrentLicense();
    
    if (!license || !license.expiresAt) {
      return { isExpired: false, daysRemaining: 9999 };
    }
    
    const now = new Date();
    const expires = new Date(license.expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      isExpired: daysRemaining < 0,
      daysRemaining: Math.max(0, daysRemaining)
    };
  },

  async extendLicense(days: number): Promise<void> {
    const db = await getDatabase();
    const license = await this.getCurrentLicense();
    
    if (!license) return;
    
    const currentExpiry = license.expiresAt ? new Date(license.expiresAt) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);
    
    await db.runAsync(
      'UPDATE app_license SET expires_at = ? WHERE is_active = 1',
      [newExpiry.toISOString().split('T')[0]]
    );
  },
};

// ==================== FASE 4: REPORTS REPOSITORY ====================

export const reportsRepository = {
  // Generate Financial Report with daily breakdown
  async generateFinancialReport(
    month: number,
    year: number
  ): Promise<import('../types').FinancialReport> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Get total income
    const incomeResult = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM incomes 
       WHERE date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // Get total expenses
    const expenseResult = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM expenses 
       WHERE date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // Get transaction count
    const txCount = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM (
         SELECT id FROM incomes WHERE date BETWEEN ? AND ?
         UNION ALL
         SELECT id FROM expenses WHERE date BETWEEN ? AND ?
       )`,
      [startDate, endDate, startDate, endDate]
    );

    // Get top category by income
    const topCategory = await db.getFirstAsync<{ category: string }>(
      `SELECT category, SUM(amount) as total 
       FROM incomes 
       WHERE date BETWEEN ? AND ? 
       GROUP BY category 
       ORDER BY total DESC 
       LIMIT 1`,
      [startDate, endDate]
    );

    // Get daily breakdown
    const dailyBreakdown: import('../types').DailyFinancialSummary[] = [];
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayIncome = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE date(date) = date(?)`,
        [dayStr]
      );
      
      const dayExpense = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date(date) = date(?)`,
        [dayStr]
      );
      
      const dayTxCount = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM (
           SELECT id FROM incomes WHERE date(date) = date(?)
           UNION ALL
           SELECT id FROM expenses WHERE date(date) = date(?)
         )`,
        [dayStr, dayStr]
      );

      const income = dayIncome?.total || 0;
      const expenses = dayExpense?.total || 0;
      
      dailyBreakdown.push({
        date: dayStr,
        income,
        expenses,
        netProfit: income - expenses,
        transactionCount: dayTxCount?.count || 0,
      });
    }

    const totalIncome = incomeResult?.total || 0;
    const totalExpenses = expenseResult?.total || 0;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      month,
      year,
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      transactionsCount: txCount?.count || 0,
      topCategory: topCategory?.category,
      dailyBreakdown,
    };
  },

  // Generate Inventory Report
  async generateInventoryReport(): Promise<import('../types').InventoryReport> {
    const db = await getDatabase();
    
    const allItems = await db.getAllAsync<import('../types').InventoryPart>(
      'SELECT * FROM inventory_parts ORDER BY name ASC'
    );

    const items = allItems || [];
    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.stockQuantity <= i.minStockLevel && i.stockQuantity > 0).length;
    const outOfStockItems = items.filter(i => i.stockQuantity === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.costPrice * item.stockQuantity), 0);

    // Group by categories
    const categoriesMap = new Map<string, { count: number; value: number }>();
    items.forEach(item => {
      const existing = categoriesMap.get(item.category) || { count: 0, value: 0 };
      categoriesMap.set(item.category, {
        count: existing.count + 1,
        value: existing.value + (item.costPrice * item.stockQuantity),
      });
    });

    const categories = Array.from(categoriesMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      value: Math.round(data.value * 100) / 100,
    }));

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue: Math.round(totalValue * 100) / 100,
      categories,
      items,
    };
  },

  // Generate Activity Report
  async generateActivityReport(
    startDate: string,
    endDate: string
  ): Promise<import('../types').ActivityReport> {
    const db = await getDatabase();

    const totalOrders = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM service_orders 
       WHERE date(received_at) BETWEEN date(?) AND date(?)`,
      [startDate, endDate]
    );

    const completedOrders = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM service_orders 
       WHERE status IN ('ENTREGADO', 'SIN_SOLUCION') 
       AND date(delivered_at) BETWEEN date(?) AND date(?)`,
      [startDate, endDate]
    );

    // Average repair time in days
    const avgRepairTime = await db.getFirstAsync<{ avg_days: number }>(
      `SELECT AVG(julianday(delivered_at) - julianday(received_at)) as avg_days 
       FROM service_orders 
       WHERE status IN ('ENTREGADO', 'SIN_SOLUCION') 
       AND delivered_at IS NOT NULL
       AND date(received_at) BETWEEN date(?) AND date(?)`,
      [startDate, endDate]
    );

    // Orders by status
    const ordersByStatusRows = await db.getAllAsync<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count 
       FROM service_orders 
       WHERE date(received_at) BETWEEN date(?) AND date(?)
       GROUP BY status`,
      [startDate, endDate]
    );

    // Orders by brand
    const ordersByBrandRows = await db.getAllAsync<{ brand: string; count: number }>(
      `SELECT equipment_brand as brand, COUNT(*) as count 
       FROM service_orders 
       WHERE date(received_at) BETWEEN date(?) AND date(?)
       GROUP BY equipment_brand
       ORDER BY count DESC
       LIMIT 10`,
      [startDate, endDate]
    );

    // Top issues
    const topIssuesRows = await db.getAllAsync<{ issue: string; count: number }>(
      `SELECT reported_issue as issue, COUNT(*) as count 
       FROM service_orders 
       WHERE date(received_at) BETWEEN date(?) AND date(?)
       GROUP BY reported_issue
       ORDER BY count DESC
       LIMIT 10`,
      [startDate, endDate]
    );

    const ordersByStatus: Record<string, number> = {};
    ordersByStatusRows?.forEach(row => {
      ordersByStatus[row.status] = row.count;
    });

    const ordersByBrand: Record<string, number> = {};
    ordersByBrandRows?.forEach(row => {
      ordersByBrand[row.brand] = row.count;
    });

    return {
      startDate,
      endDate,
      totalOrders: totalOrders?.count || 0,
      completedOrders: completedOrders?.count || 0,
      avgRepairTime: Math.round((avgRepairTime?.avg_days || 0) * 10) / 10,
      ordersByStatus,
      ordersByBrand,
      topIssues: topIssuesRows?.map(r => ({ issue: r.issue, count: r.count })) || [],
    };
  },

  // Cache report results for faster subsequent loads
  async cacheReport(
    reportType: string,
    periodStart: string,
    periodEnd: string,
    data: any,
    ttlHours: number = 24
  ): Promise<void> {
    const db = await getDatabase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await db.runAsync(
      `INSERT OR REPLACE INTO reports_cache (report_type, period_start, period_end, data, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [reportType, periodStart, periodEnd, JSON.stringify(data), expiresAt.toISOString()]
    );
  },

  // Get cached report if not expired
  async getCachedReport(
    reportType: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ data: string }>(
      `SELECT data FROM reports_cache 
       WHERE report_type = ? 
       AND period_start = ? 
       AND period_end = ? 
       AND (expires_at IS NULL OR expires_at > datetime('now'))`,
      [reportType, periodStart, periodEnd]
    );

    if (result?.data) {
      return JSON.parse(result.data);
    }
    return null;
  },

  // Clear expired cache entries
  async clearExpiredCache(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM reports_cache WHERE expires_at IS NOT NULL AND expires_at < datetime('now')`
    );
  },
};

// ==================== FASE 4: ACTIVITY LOG REPOSITORY ====================

export const activityLogRepository = {
  // Log an action
  async log(
    userAction: string,
    entityType?: string,
    entityId?: number,
    oldValue?: any,
    newValue?: any
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO activity_log (user_action, entity_type, entity_id, old_value, new_value)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userAction,
        entityType || null,
        entityId || null,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ]
    );
  },

  // Get activity log for an entity
  async getByEntity(
    entityType: string,
    entityId: number,
    limit: number = 50
  ): Promise<any[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync(
      `SELECT * FROM activity_log 
       WHERE entity_type = ? AND entity_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [entityType, entityId, limit]
    );
    return result?.map(row => ({
      ...row,
      old_value: row.old_value ? JSON.parse(row.old_value) : null,
      new_value: row.new_value ? JSON.parse(row.new_value) : null,
    })) || [];
  },

  // Get recent activity log
  async getRecent(limit: number = 100): Promise<any[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync(
      `SELECT * FROM activity_log 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [limit]
    );
    return result?.map(row => ({
      ...row,
      old_value: row.old_value ? JSON.parse(row.old_value) : null,
      new_value: row.new_value ? JSON.parse(row.new_value) : null,
    })) || [];
  },

  // Clear old logs (older than specified days)
  async clearOlderThan(days: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM activity_log WHERE created_at < datetime('now', '-' || ? || ' days')`,
      [days]
    );
  },
};

// ==================== FASE 4: BACKUP REPOSITORY ====================

export const backupRepository = {
  // Get list of backup metadata
  async getBackupHistory(): Promise<any[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync(
      `SELECT * FROM backup_metadata ORDER BY created_at DESC`
    );
    return result || [];
  },

  // Register a new backup
  async registerBackup(
    backupPath: string,
    backupSize: number,
    tablesIncluded: string[],
    isEncrypted: boolean = false
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO backup_metadata (backup_path, backup_size, tables_included, is_encrypted)
       VALUES (?, ?, ?, ?)`,
      [backupPath, backupSize, JSON.stringify(tablesIncluded), isEncrypted ? 1 : 0]
    );
  },

  // Get latest backup info
  async getLatestBackup(): Promise<any | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT * FROM backup_metadata ORDER BY created_at DESC LIMIT 1`
    );
    return result || null;
  },
};
