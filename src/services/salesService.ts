/**
 * SERVICIO DE VENTAS Y FACTURACIÓN GANADERA - CONECTADO CON FIRESTORE
 * Colección: 'sales'
 */

import { Sale } from '../types';
import { activityService } from './activityService';
import { tryFirestoreGet, tryFirestoreSet, tryFirestoreDelete } from './firestoreHelper';

const COLLECTION_NAME = 'sales';
const LOCAL_STORAGE_KEY = 'agrogestion_sales_data';

let salesStore: Sale[] = [];
let isLoaded = false;

function loadFromStorage(): Sale[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToStorage(sales: Sale[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sales));
  } catch (err) {
    console.error('Error saving sales to localStorage:', err);
  }
}

export interface SalesMetrics {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  accumulatedTotal: number;
  todaySalesCount: number;
}

export const salesService = {
  async getAll(): Promise<Sale[]> {
    if (!isLoaded) {
      salesStore = loadFromStorage();
      const res = await tryFirestoreGet<Sale>(COLLECTION_NAME, salesStore);
      if (res.fromFirestore && res.data.length > 0) {
        salesStore = res.data;
        saveToStorage(salesStore);
      }
      isLoaded = true;
    }
    return [...salesStore];
  },

  async addSale(saleData: Omit<Sale, 'id' | 'saleNumber'>, operatorName = 'Rodrigo Caballero'): Promise<Sale> {
    await this.getAll();

    const saleNumber = `VTA-${String(salesStore.length + 1).padStart(3, '0')}`;
    const newSale: Sale = {
      ...saleData,
      id: `sl-${Date.now()}`,
      saleNumber,
      registeredBy: operatorName,
    };

    salesStore.unshift(newSale);
    saveToStorage(salesStore);

    await tryFirestoreSet(COLLECTION_NAME, newSale.id, newSale);

    activityService.log({
      userName: operatorName,
      action: `Registro de Venta ${newSale.saleNumber}`,
      module: 'Ventas',
      details: `${newSale.productName} (${newSale.quantity} ${newSale.unit}) - Total: $${newSale.total.toFixed(2)} [Cliente: ${newSale.customerName}]`
    });

    return newSale;
  },

  async deleteSale(id: string, operatorName = 'Rodrigo Caballero'): Promise<void> {
    await this.getAll();
    const target = salesStore.find((s) => s.id === id);
    if (!target) return;

    salesStore = salesStore.filter((s) => s.id !== id);
    saveToStorage(salesStore);

    await tryFirestoreDelete(COLLECTION_NAME, id);

    activityService.log({
      userName: operatorName,
      action: `Eliminación de Venta ${target.saleNumber}`,
      module: 'Ventas',
      details: `Eliminada venta por valor de $${target.total.toFixed(2)} (${target.productName}).`
    });
  },

  async getMetrics(): Promise<SalesMetrics> {
    await this.getAll();
    const today = new Date().toISOString().split('T')[0];
    
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    let todaySales = 0;
    let todaySalesCount = 0;
    let weekSales = 0;
    let monthSales = 0;
    let accumulatedTotal = 0;

    salesStore.forEach((s) => {
      accumulatedTotal += (Number(s.total) || 0);

      if (s.date === today) {
        todaySales += (Number(s.total) || 0);
        todaySalesCount++;
      }

      if (s.date >= weekAgoStr) {
        weekSales += (Number(s.total) || 0);
      }

      if (s.date >= monthStart) {
        monthSales += (Number(s.total) || 0);
      }
    });

    return {
      todaySales,
      weekSales,
      monthSales,
      accumulatedTotal,
      todaySalesCount,
    };
  }
};
