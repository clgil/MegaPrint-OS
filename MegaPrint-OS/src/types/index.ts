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

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface WorkshopConfig {
  id: number;
  workshopName: string;
  workshopLogo?: string; // Base64 or path
  address?: string;
  phone?: string;
  email?: string;
  warrantyTerms?: string;
  taxId?: string;
}
