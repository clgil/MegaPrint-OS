// Database types for MegaPrint OS

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface ServiceOrder {
  id: number;
  orderNumber: string; // e.g., MPL-1001
  clientId: number;
  equipmentBrand: string;
  equipmentModel: string;
  equipmentSerialNumber?: string;
  reportedIssue: string;
  aestheticState: AestheticState;
  status: OrderStatus;
  diagnosis?: string;
  solutionApplied?: string;
  partsUsed: PartUsed[];
  laborCost: number;
  partsCost: number;
  totalPrice: number;
  receivedAt: string;
  updatedAt: string;
  deliveredAt?: string;
  customerSignature?: string; // Base64 encoded signature
  technicianSignature?: string;
  warrantyUntil?: string; // FASE 2: Fecha límite de garantía
}

export interface AestheticState {
  scratches: boolean;
  dents: boolean;
  missingParts: boolean;
  screenDamage: boolean;
  otherDamage: boolean;
  notes?: string;
}

export type OrderStatus = 
  | 'RECIBIDO'
  | 'EN_DIAGNOSTICO'
  | 'ESPERANDO_PIEZA'
  | 'REPARADO'
  | 'ENTREGADO'
  | 'SIN_SOLUCION';

export interface PartUsed {
  id: number;
  partId: number;
  orderId: number;
  quantity: number;
  unitPrice: number;
}

export interface InventoryPart {
  id: number;
  name: string;
  description?: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  costPrice: number;
  salePrice: number;
  createdAt: string;
  updatedAt: string;
}

// FASE 2: Tipos para módulo financiero
export type ExpenseCategory = 
  | 'INSUMOS'
  | 'HERRAMIENTAS'
  | 'SERVICIOS'
  | 'ALQUILER'
  | 'TRANSPORTE'
  | 'MARKETING'
  | 'IMPUESTOS'
  | 'NOMINA'
  | 'OTROS';

export type IncomeCategory = 
  | 'SERVICIO_TECNICO'
  | 'VENTA_REPUESTOS'
  | 'MANTENIMIENTO'
  | 'OTROS';

export interface Expense {
  id: number;
  description: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  receiptImage?: string; // Base64 o path de imagen del comprobante
}

export interface Income {
  id: number;
  description: string;
  category: IncomeCategory | string;
  amount: number;
  date: string;
  orderId?: number; // Vinculado a orden de servicio si aplica
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE_PLIN' | 'CHEQUE';

export interface MonthlyFinancialSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  serviceCount: number;
  averageTicket: number;
}

export interface DailyFinancialSummary {
  date: string;
  income: number;
  expenses: number;
  netProfit: number;
  transactionCount: number;
}

export interface WarrantyClaim {
  id: number;
  orderId: number;
  claimDate: string;
  description: string;
  resolution?: string;
  status: WarrantyStatus;
  resolvedAt?: string;
  costToWorkshop: number; // Costo asumido por el taller en la garantía
}

export type WarrantyStatus = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';

export interface WorkshopConfig {
  id: number;
  workshopName: string;
  workshopLogo?: string; // Base64 or path
  address?: string;
  phone?: string;
  email?: string;
  warrantyTerms?: string;
  warrantyDays?: number; // FASE 2: Días de garantía por defecto
  taxId?: string;
  currencySymbol?: string; // FASE 2: Símbolo de moneda ($, S/, etc.)
}

// FASE 2: Tipos para dashboard
export interface DashboardMetrics {
  currentMonth: MonthlyFinancialSummary;
  lastMonth: MonthlyFinancialSummary;
  growthPercentage: number;
  topServices: { name: string; count: number; revenue: number }[];
  lowStockItems: InventoryPart[];
  pendingWarrantyClaims: WarrantyClaim[];
  recentTransactions: (Income | Expense)[];
}
