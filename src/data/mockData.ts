/**
 * DATOS INICIALES DEL SISTEMA DE GESTIÓN GANADERA
 * 
 * Configurado para el propietario: Rodrigo Caballero (Admin) y Sra. Migdalia Caballero (Operadora).
 * Todo el panel y operaciones comienzan en 0 para que los propietarios
 * ingresen, editen y gestionen sus datos reales.
 */

import {
  Animal,
  InventoryItem,
  InventoryMovement,
  Product,
  ProductionRecord,
  Sale,
  AuditActivity,
  User,
  DailyClose,
  RanchSettings,
  CowMilkingRecord
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-rodrigo',
    username: 'rodrigo caballero',
    fullName: 'Rodrigo Caballero',
    email: 'rodrigo@haciendacaballero.com',
    role: 'ADMINISTRADOR',
    active: true,
    status: 'Activo',
    lastLogin: 'En línea',
    title: 'Propietario / Administrador General',
    password: '123456'
  },
  {
    id: 'usr-operador-migdalia',
    username: 'migdalia',
    fullName: 'Sra. Migdalia Caballero',
    email: 'migdalia@haciendacaballero.com',
    role: 'USUARIO_REGULAR',
    active: true,
    status: 'Activo',
    lastLogin: 'Nunca',
    title: 'Operadora de Campo',
    password: '123456'
  }
];

// Todo en 0: El usuario agregará, editará y eliminará sus datos reales
export const INITIAL_ANIMALS: Animal[] = [];

export const INITIAL_MILKING: CowMilkingRecord[] = [];

export const INITIAL_ITEMS: InventoryItem[] = [];

export const INITIAL_MOVEMENTS: InventoryMovement[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_PRODUCTION: ProductionRecord[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_ACTIVITIES: AuditActivity[] = [
  {
    id: 'act-init-01',
    userId: 'usr-admin-rodrigo',
    userName: 'Rodrigo Caballero',
    role: 'ADMINISTRADOR',
    action: 'Inicialización de Sistema Ganadero',
    module: 'Configuración',
    date: new Date().toISOString().split('T')[0],
    time: '06:00',
    details: 'Base de datos lista en 0 para gestión de Rodrigo Caballero.'
  }
];

export const INITIAL_DAILY_CLOSES: DailyClose[] = [];

export const INITIAL_RANCH_SETTINGS: RanchSettings = {
  ranchName: 'Hacienda Ganadera Caballero',
  ownerName: 'Rodrigo Caballero',
  registrationNumber: 'REG-2026-CABALLERO',
  location: 'Sector Agropecuario Principal',
  totalHectares: 350,
  pasturesCount: 8,
  currency: 'USD ($)',
  lowStockAlertDays: 5,
  phone: '+1 (555) 019-2834',
  email: 'administracion@haciendacaballero.com'
};
