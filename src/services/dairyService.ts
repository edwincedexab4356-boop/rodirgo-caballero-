import { CowMilkingRecord } from '../types';
import { activityService } from './activityService';
import { tryFirestoreGet, tryFirestoreSet, tryFirestoreDelete } from './firestoreHelper';

const COLLECTION_NAME = 'dairy_milking';
const LOCAL_STORAGE_KEY = 'agrogestion_dairy_milking';

// Estado en memoria / cache local inicializado en 0 operaciones
let milkingCache: CowMilkingRecord[] = [];
let isLoaded = false;

function loadFromStorage(): CowMilkingRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToStorage(records: CowMilkingRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving dairy records to local storage:', err);
  }
}

export const dairyService = {
  /**
   * Obtiene todos los registros de ordeño individuales de las vacas.
   * Conecta con Firestore en la colección 'dairy_milking'.
   */
  async getRecords(): Promise<CowMilkingRecord[]> {
    if (!isLoaded) {
      milkingCache = loadFromStorage();
      const res = await tryFirestoreGet<CowMilkingRecord>(COLLECTION_NAME, milkingCache);
      if (res.fromFirestore && res.data.length > 0) {
        milkingCache = res.data;
        saveToStorage(milkingCache);
      }
      isLoaded = true;
    }
    return [...milkingCache].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  /**
   * Filtra registros de ordeño por fecha.
   */
  async getRecordsByDate(date: string): Promise<CowMilkingRecord[]> {
    const all = await this.getRecords();
    return all.filter((r) => r.date === date);
  },

  /**
   * Historial de producción lechera de una vaca específica por su código/arete.
   */
  async getCowRecords(cowCode: string): Promise<CowMilkingRecord[]> {
    const all = await this.getRecords();
    return all.filter(
      (r) => r.cowCode.trim().toUpperCase() === cowCode.trim().toUpperCase()
    );
  },

  /**
   * Registra un nuevo ordeño para una vaca (cuántos litros produjo).
   */
  async addRecord(
    recordData: Omit<CowMilkingRecord, 'id' | 'createdAt'>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<CowMilkingRecord> {
    await this.getRecords();

    const newRecord: CowMilkingRecord = {
      ...recordData,
      id: `milk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };

    milkingCache.unshift(newRecord);
    saveToStorage(milkingCache);

    // Guardar en Firestore colección 'dairy_milking'
    await tryFirestoreSet(COLLECTION_NAME, newRecord.id, newRecord);

    // Auditoría
    activityService.log({
      userId: 'op-current',
      userName: operatorName,
      role: 'ADMINISTRADOR',
      action: 'Registro de Ordeño Individual',
      module: 'Lechería',
      details: `Vaca ${newRecord.cowCode} (${newRecord.cowName || 'Sin nombre'}): ${newRecord.liters} L en turno ${newRecord.shift}.`,
    });

    return newRecord;
  },

  /**
   * Edita un registro de ordeño existente.
   */
  async updateRecord(
    id: string,
    updates: Partial<CowMilkingRecord>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<CowMilkingRecord> {
    await this.getRecords();
    const index = milkingCache.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Registro de ordeño no encontrado.');

    const updated: CowMilkingRecord = {
      ...milkingCache[index],
      ...updates,
    };

    milkingCache[index] = updated;
    saveToStorage(milkingCache);

    await tryFirestoreSet(COLLECTION_NAME, id, updated);

    activityService.log({
      userId: 'op-current',
      userName: operatorName,
      role: 'ADMINISTRADOR',
      action: 'Actualización de Ordeño',
      module: 'Lechería',
      details: `Modificado ordeño de vaca ${updated.cowCode}: ahora ${updated.liters} L.`,
    });

    return updated;
  },

  /**
   * Elimina un registro de ordeño.
   */
  async deleteRecord(id: string, operatorName = 'Rodrigo Caballero'): Promise<void> {
    await this.getRecords();
    const target = milkingCache.find((r) => r.id === id);
    if (!target) return;

    milkingCache = milkingCache.filter((r) => r.id !== id);
    saveToStorage(milkingCache);

    // Eliminar de Firestore
    await tryFirestoreDelete(COLLECTION_NAME, id);

    activityService.log({
      userId: 'op-current',
      userName: operatorName,
      role: 'ADMINISTRADOR',
      action: 'Eliminación de Ordeño',
      module: 'Lechería',
      details: `Eliminado registro de ${target.liters} L de vaca ${target.cowCode} (${target.date}).`,
    });
  },

  /**
   * Obtiene métricas y estadísticas consolidadas:
   * - Total de leche hoy
   * - Vacas ordeñadas hoy
   * - Promedio litros por vaca hoy
   * - Producción total acumulada
   * - Ranking de vacas por producción
   */
  async getDairyStats(selectedDate?: string) {
    const all = await this.getRecords();
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];

    const todayRecords = all.filter((r) => r.date === targetDate);
    const todayLiters = todayRecords.reduce((sum, r) => sum + (Number(r.liters) || 0), 0);
    
    // Vacas únicas ordeñadas hoy
    const uniqueCowsToday = new Set(todayRecords.map((r) => r.cowCode.trim().toUpperCase()));
    const todayCowsCount = uniqueCowsToday.size;
    const avgLitersPerCow = todayCowsCount > 0 ? Number((todayLiters / todayCowsCount).toFixed(2)) : 0;

    // Producción del mes actual
    const currentYearMonth = targetDate.substring(0, 7); // YYYY-MM
    const monthRecords = all.filter((r) => r.date.startsWith(currentYearMonth));
    const monthLiters = monthRecords.reduce((sum, r) => sum + (Number(r.liters) || 0), 0);

    // Total histórico
    const totalLitersAllTime = all.reduce((sum, r) => sum + (Number(r.liters) || 0), 0);

    // Agrupación por vaca (para saber cuánto produce cada una)
    const cowMap: Record<
      string,
      { cowCode: string; cowName?: string; totalLiters: number; count: number }
    > = {};

    all.forEach((r) => {
      const code = r.cowCode.trim().toUpperCase();
      if (!cowMap[code]) {
        cowMap[code] = {
          cowCode: code,
          cowName: r.cowName,
          totalLiters: 0,
          count: 0,
        };
      }
      cowMap[code].totalLiters += Number(r.liters) || 0;
      cowMap[code].count += 1;
      if (r.cowName && !cowMap[code].cowName) {
        cowMap[code].cowName = r.cowName;
      }
    });

    const cowRankings = Object.values(cowMap).map((c) => ({
      cowCode: c.cowCode,
      cowName: c.cowName || 'Vaca ' + c.cowCode,
      totalLiters: Number(c.totalLiters.toFixed(1)),
      recordsCount: c.count,
      avgLiters: c.count > 0 ? Number((c.totalLiters / c.count).toFixed(2)) : 0,
    })).sort((a, b) => b.totalLiters - a.totalLiters);

    return {
      todayLiters: Number(todayLiters.toFixed(1)),
      todayCowsCount,
      avgLitersPerCow,
      monthLiters: Number(monthLiters.toFixed(1)),
      totalLitersAllTime: Number(totalLitersAllTime.toFixed(1)),
      cowRankings,
    };
  },

  /**
   * Reinicia todos los registros a 0 (para empezar desde limpio según orden del usuario).
   */
  async clearAll(): Promise<void> {
    milkingCache = [];
    saveToStorage([]);
  }
};
