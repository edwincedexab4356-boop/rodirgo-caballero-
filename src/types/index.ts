export type UserRole = 'ADMINISTRADOR' | 'USUARIO_REGULAR' | 'USUARIO REGULAR';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  status?: 'Activo' | 'Inactivo';
  lastLogin: string;
  title?: string;
  password?: string;
}

export type AnimalType = 'vaca';
export type AnimalSex = 'Macho' | 'Hembra';
export type AnimalStatus = 'Activo' | 'En Tratamiento' | 'Gestación' | 'Vendido' | 'Cuarentena' | 'Baja';

export interface Animal {
  id: string;
  code: string; // Número o arete
  name?: string;
  type: AnimalType;
  breed: string; // raza: red sindi, holstein, pardo suizo,ayrshire,guernsey,simmental,canadiennei,smortorn,montbeliarde,guzerat,jersey .
  sex: AnimalSex;
  ageMonths: number;
  weightKg: number;
  ingressDate: string;
  status: AnimalStatus;
  location: string; // Potrero o corral
  observations?: string;
  fatherCode?: string;
  motherCode?: string;
}

export type InventoryCategory = 'Alimentos' | 'Medicamentos' | 'Herramientas' | 'Insumos' | 'Equipos' | 'Otros';
export type InventoryStatus = 'Disponible' | 'Bajo' | 'Agotado';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string; // kg, litros, dosis, sacos, unidades
  minStock: number;
  status: InventoryStatus;
  costPerUnit: number;
  lastUpdated: string;
  location: string;
}

export type MovementType = 'Entrada' | 'Salida';

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  unit: string;
  date: string;
  reason: string;
  registeredBy: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  unit: string;
  status: 'Disponible' | 'Bajo Stock' | 'Agotado';
  description: string;
  createdAt: string;
}

export type ProductionType = 'Leche' | 'Carne / Ceba' | 'Genética / Pajillas' | 'Queso Artesanal' | 'Lana' | 'Otros';

export interface ProductionRecord {
  id: string;
  date: string;
  type: ProductionType;
  quantity: number;
  unit: string;
  shift: 'Mañana' | 'Tarde' | 'Jornada Completa';
  responsible: string;
  observations: string;
}

export interface Sale {
  id: string;
  saleNumber: string; // N° VTA-0012
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  customerName: string;
  registeredBy: string;
  paymentMethod: 'Transferencia' | 'Efectivo' | 'Crédito Ganadero';
}

export interface CowMilkingRecord {
  id: string;
  cowCode: string;
  cowName?: string;
  date: string;
  shift: 'Mañana' | 'Tarde' | 'Completo';
  liters: number;
  fatOrQuality?: string;
  milker: string;
  notes?: string;
  createdAt?: string;
}

export interface AuditActivity {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  module: 'Ganado' | 'Lechería' | 'Inventario' | 'Productos' | 'Producción' | 'Ventas' | 'Usuarios' | 'Cierre Diario' | 'Configuración' | 'Seguridad';
  date: string;
  time: string;
  details?: string;
}

export type ActivityLog = AuditActivity;

export interface DailyClose {
  id: string;
  date: string;
  totalSales: number;
  salesCount: number;
  productionSummary: { type: string; total: number; unit: string }[];
  inventoryEntries: number;
  inventoryExits: number;
  livestockMovements: number;
  closedBy: string;
  closedAt: string;
  notes: string;
  status: 'Abierto' | 'Cerrado';
}

export interface RanchSettings {
  ranchName: string;
  ownerName: string;
  registrationNumber: string; // Registro ICA o sanitario
  location: string;
  totalHectares: number;
  pasturesCount: number;
  currency: string;
  lowStockAlertDays: number;
  phone: string;
  email: string;
}
