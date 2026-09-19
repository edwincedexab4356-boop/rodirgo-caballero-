/**
 * SERVICIO DE CIERRE DIARIO Y RESUMEN DEL DÍA
 * 
 * [ARQUITECTURA PREPARADA PARA FIRESTORE]:
 * Mapeo con colección "cierres_diarios":
 * - setDoc(doc(db, "cierres_diarios", date), closeData)
 * - getDoc(doc(db, "cierres_diarios", date))
 */

import { DailyClose } from '../types';
import { INITIAL_DAILY_CLOSES } from '../data/mockData';
import { salesService } from './salesService';
import { productionService } from './productionService';
import { inventoryService } from './inventoryService';
import { activityService } from './activityService';

let dailyClosesStore: DailyClose[] = [...INITIAL_DAILY_CLOSES];

export const dailyCloseService = {
  async getAll(): Promise<DailyClose[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [...dailyClosesStore];
  },

  async getSummaryForDate(date: string) {
    const allSales = await salesService.getAll();
    const allProd = await productionService.getAll();
    const allMovements = await inventoryService.getMovements();
    const allActivities = await activityService.getAll();

    // Filtros por fecha
    const daySales = allSales.filter((s) => s.date === date);
    const dayProd = allProd.filter((p) => p.date === date);
    const dayMovements = allMovements.filter((m) => m.date.startsWith(date));
    const dayActivities = allActivities.filter((a) => a.date === date);

    const totalSales = daySales.reduce((acc, curr) => acc + curr.total, 0);
    const salesCount = daySales.length;

    // Resumen de producción por tipo
    const prodMap: Record<string, { total: number; unit: string }> = {};
    dayProd.forEach((p) => {
      if (!prodMap[p.type]) {
        prodMap[p.type] = { total: 0, unit: p.unit };
      }
      prodMap[p.type].total += p.quantity;
    });
    const productionSummary = Object.entries(prodMap).map(([type, data]) => ({
      type,
      total: data.total,
      unit: data.unit,
    }));

    const inventoryEntries = dayMovements.filter((m) => m.type === 'Entrada').length;
    const inventoryExits = dayMovements.filter((m) => m.type === 'Salida').length;
    const livestockMovements = dayActivities.filter((a) => a.module === 'Ganado').length;

    // Verificar si ya existe un cierre guardado para hoy
    const existingClose = dailyClosesStore.find((c) => c.date === date);

    return {
      date,
      totalSales,
      salesCount,
      daySales,
      productionSummary,
      dayProd,
      inventoryEntries,
      inventoryExits,
      dayMovements,
      livestockMovements,
      dayActivities,
      isClosed: !!existingClose && existingClose.status === 'Cerrado',
      existingClose,
    };
  },

  async closeDay(date: string, closedBy: string, notes: string): Promise<DailyClose> {
    const summary = await this.getSummaryForDate(date);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newClose: DailyClose = {
      id: `close-${date}`,
      date,
      totalSales: summary.totalSales,
      salesCount: summary.salesCount,
      productionSummary: summary.productionSummary,
      inventoryEntries: summary.inventoryEntries,
      inventoryExits: summary.inventoryExits,
      livestockMovements: summary.livestockMovements,
      closedBy,
      closedAt: timeStr,
      notes,
      status: 'Cerrado',
    };

    // Reemplazar si existe o agregar
    const index = dailyClosesStore.findIndex((c) => c.date === date);
    if (index >= 0) {
      dailyClosesStore[index] = newClose;
    } else {
      dailyClosesStore.unshift(newClose);
    }

    activityService.log({
      userName: closedBy,
      action: `Cierre del Día Ejecutado (${date})`,
      module: 'Cierre Diario',
      details: `Ventas totales: $${summary.totalSales.toFixed(2)} (${summary.salesCount} ventas). Movimientos: ${summary.inventoryEntries + summary.inventoryExits}`
    });

    return newClose;
  }
};
