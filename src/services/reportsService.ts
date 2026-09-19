/**
 * SERVICIO DE REPORTES Y ANALÍTICA GANADERA
 * 
 * [ARQUITECTURA PREPARADA PARA FIRESTORE]:
 * Agregaciones y consultas compuestas por rangos de fecha.
 */

import { salesService } from './salesService';
import { productionService } from './productionService';
import { livestockService } from './livestockService';
import { inventoryService } from './inventoryService';

export type ReportPeriod = 'dia' | 'semana' | 'mes' | 'historico';

export const reportsService = {
  async getReportData(period: ReportPeriod, customStartDate?: string, customEndDate?: string) {
    const [sales, production, animals, inventory, movements] = await Promise.all([
      salesService.getAll(),
      productionService.getAll(),
      livestockService.getAll(),
      inventoryService.getAll(),
      inventoryService.getMovements(),
    ]);

    const now = new Date();
    let startDate = new Date();

    if (period === 'dia') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'semana') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'mes') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === 'historico') {
      startDate = new Date(2020, 0, 1);
    }

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = customEndDate || now.toISOString().split('T')[0];

    // Filtrar ventas por rango
    const filteredSales = sales.filter((s) => s.date >= startStr && s.date <= endStr);
    const totalSalesAmount = filteredSales.reduce((acc, curr) => acc + curr.total, 0);

    // Ventas agrupadas por fecha para gráfico
    const salesByDateMap: Record<string, number> = {};
    filteredSales.forEach((s) => {
      salesByDateMap[s.date] = (salesByDateMap[s.date] || 0) + s.total;
    });
    const salesTrend = Object.entries(salesByDateMap)
      .map(([date, total]) => ({ date: date.slice(5), total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Producción agrupada por tipo
    const filteredProd = production.filter((p) => p.date >= startStr && p.date <= endStr);
    const prodByTypeMap: Record<string, number> = {};
    filteredProd.forEach((p) => {
      prodByTypeMap[p.type] = (prodByTypeMap[p.type] || 0) + p.quantity;
    });
    const productionByType = Object.entries(prodByTypeMap).map(([type, total]) => ({
      name: type,
      value: total,
    }));

    // Distribución de ganado por Raza
    const breedMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    animals.forEach((a) => {
      breedMap[a.breed] = (breedMap[a.breed] || 0) + 1;
      statusMap[a.status] = (statusMap[a.status] || 0) + 1;
    });

    const animalsByBreed = Object.entries(breedMap).map(([breed, count]) => ({
      name: breed,
      value: count,
    }));

    const animalsByStatus = Object.entries(statusMap).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    // Movimientos de inventario entradas vs salidas
    const filteredMovements = movements.filter((m) => m.date.slice(0, 10) >= startStr && m.date.slice(0, 10) <= endStr);
    const entriesCount = filteredMovements.filter((m) => m.type === 'Entrada').length;
    const exitsCount = filteredMovements.filter((m) => m.type === 'Salida').length;

    // Estado del inventario (categorías)
    const inventoryValuation = inventory.reduce((acc, curr) => acc + curr.quantity * curr.costPerUnit, 0);

    return {
      period,
      totalSalesAmount,
      salesCount: filteredSales.length,
      salesTrend,
      productionByType,
      totalAnimals: animals.length,
      animalsByBreed,
      animalsByStatus,
      inventoryValuation,
      entriesCount,
      exitsCount,
      movementsCount: filteredMovements.length,
    };
  }
};
