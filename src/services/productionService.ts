/**
 * SERVICIO DE PRODUCCIÓN GANADERA Y LECHERA - CONECTADO CON FIRESTORE
 * Colección: 'production'
 */

import { ProductionRecord } from '../types';
import { activityService } from './activityService';
import { tryFirestoreGet, tryFirestoreSet, tryFirestoreDelete } from './firestoreHelper';

const COLLECTION_NAME = 'production';
const LOCAL_STORAGE_KEY = 'agrogestion_production_data';

let productionStore: ProductionRecord[] = [];
let isLoaded = false;

function loadFromStorage(): ProductionRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToStorage(records: ProductionRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving production to localStorage:', err);
  }
}

export const productionService = {
  async getAll(): Promise<ProductionRecord[]> {
    if (!isLoaded) {
      productionStore = loadFromStorage();
      const res = await tryFirestoreGet<ProductionRecord>(COLLECTION_NAME, productionStore);
      if (res.fromFirestore && res.data.length > 0) {
        productionStore = res.data;
        saveToStorage(productionStore);
      }
      isLoaded = true;
    }
    return [...productionStore];
  },

  async addRecord(
    recordData: Omit<ProductionRecord, 'id'>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<ProductionRecord> {
    await this.getAll();

    const newRecord: ProductionRecord = {
      ...recordData,
      id: `prod-rec-${Date.now()}`,
    };

    productionStore.unshift(newRecord);
    saveToStorage(productionStore);

    await tryFirestoreSet(COLLECTION_NAME, newRecord.id, newRecord);

    activityService.log({
      userName: operatorName,
      action: `Registro de Producción: ${newRecord.type}`,
      module: 'Producción',
      details: `${newRecord.quantity} ${newRecord.unit} (${newRecord.shift}). Responsable: ${newRecord.responsible}`
    });

    return newRecord;
  },

  async deleteRecord(id: string, operatorName = 'Rodrigo Caballero'): Promise<void> {
    await this.getAll();
    const target = productionStore.find((p) => p.id === id);
    if (!target) return;

    productionStore = productionStore.filter((p) => p.id !== id);
    saveToStorage(productionStore);

    await tryFirestoreDelete(COLLECTION_NAME, id);

    activityService.log({
      userName: operatorName,
      action: `Eliminación de Registro de Producción: ${target.type}`,
      module: 'Producción',
      details: `Eliminado lote de ${target.quantity} ${target.unit} (${target.date}).`
    });
  },

  async getProductionStats() {
    await this.getAll();
    const today = new Date().toISOString().split('T')[0];
    
    // Producción de hoy (e.g. leche en litros)
    const todayRecords = productionStore.filter((p) => p.date === today);
    const todayMilk = todayRecords
      .filter((p) => p.type === 'Leche')
      .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    // Últimos 7 días
    const last7DaysMap: Record<string, { date: string; leche: number; queso: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      last7DaysMap[dStr] = { date: dStr.slice(5), leche: 0, queso: 0 };
    }

    productionStore.forEach((p) => {
      if (last7DaysMap[p.date]) {
        if (p.type === 'Leche') last7DaysMap[p.date].leche += (Number(p.quantity) || 0);
        if (p.type === 'Queso Artesanal') last7DaysMap[p.date].queso += (Number(p.quantity) || 0);
      }
    });

    return {
      todayMilk,
      todayRecordsCount: todayRecords.length,
      chartData: Object.values(last7DaysMap),
    };
  }
};
