import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { livestockService } from '../services/livestockService';
import { inventoryService } from '../services/inventoryService';
import { salesService, SalesMetrics } from '../services/salesService';
import { productionService } from '../services/productionService';
import { productsService } from '../services/productsService';
import { dailyCloseService } from '../services/dailyCloseService';
import { activityService } from '../services/activityService';
import { dairyService } from '../services/dairyService';
import { NavigationTab } from '../components/layout/Sidebar';
import { Animal, InventoryItem, AuditActivity } from '../types';
import {
  Binary,
  Boxes,
  Receipt,
  TrendingUp,
  ShoppingBag,
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  CalendarCheck2,
  Plus,
  Milk
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // States
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [dairyStats, setDairyStats] = useState<{
    todayLiters: number;
    todayCowsCount: number;
    avgLitersPerCow: number;
    monthLiters: number;
  }>({
    todayLiters: 0,
    todayCowsCount: 0,
    avgLitersPerCow: 0,
    monthLiters: 0,
  });
  const [productsCount, setProductsCount] = useState(0);
  const [todayMovementsCount, setTodayMovementsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<AuditActivity[]>([]);
  const [isDayClosed, setIsDayClosed] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        const [
          allAnimals,
          allInv,
          allMovements,
          metrics,
          dStats,
          allProducts,
          activities,
          closeSummary
        ] = await Promise.all([
          livestockService.getAll(),
          inventoryService.getAll(),
          inventoryService.getMovements(),
          salesService.getMetrics(),
          dairyService.getDairyStats(todayStr),
          productsService.getAll(),
          activityService.getAll(),
          dailyCloseService.getSummaryForDate(todayStr),
        ]);

        setAnimals(allAnimals);
        setInventory(allInv);
        setSalesMetrics(metrics);
        setDairyStats(dStats);
        setProductsCount(allProducts.length);
        
        const todayMovs = allMovements.filter((m) => m.date.startsWith(todayStr));
        setTodayMovementsCount(todayMovs.length);

        setRecentActivities(activities.slice(0, 5));
        setIsDayClosed(closeSummary.isClosed);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const lowStockItems = inventory.filter((i) => i.status === 'Bajo' || i.status === 'Agotado');
  const medicalCases = animals.filter((a) => a.status === 'En Tratamiento' || a.status === 'Cuarentena');
  const pregnantCows = animals.filter((a) => a.status === 'Gestación');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs tracking-wider text-[#999999] uppercase">
          Sincronizando estado operativo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Ranch Operational Status Banner - Flat Matte Dark Styling */}
      <div className="bg-[#0D0D0D] border border-[#222222] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-[#18150B] text-[#C9A227] border border-[#3A3215]">
              Hacienda Ganadera Caballero
            </span>
            <span className="text-xs text-[#777777]">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] tracking-tight">
            Panel de Control Operativo
          </h2>
          <p className="text-xs text-[#A0A0A0]">
            Bienvenido, <strong className="text-[#C9A227]">{user?.fullName}</strong>. Registro y supervisión general de la operación ganadera.
          </p>
        </div>

        {/* Daily Close Status CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('lecheria')}
            className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase bg-[#C9A227] hover:bg-[#D4AF37] text-[#0A0A0A] font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Milk className="w-4 h-4" />
            <span>Módulo de Lechería</span>
          </button>

          <button
            onClick={() => onNavigate('cierre-diario')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 border ${
              isDayClosed
                ? 'bg-[#121812] text-[#81C784] border-[#2E4A2E]'
                : 'bg-[#141414] hover:bg-[#1E1E1E] text-[#D0D0D0] border-[#303030]'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 text-[#C9A227]" />
            <span>{isDayClosed ? 'Día Cerrado' : 'Cierre Diario'}</span>
          </button>
        </div>
      </div>

      {/* Main Stat Cards Grid - Solid Matte Dark Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="LECHE HOY"
          value={`${dairyStats.todayLiters} L`}
          subtitle={`${dairyStats.todayCowsCount} vacas ordeñadas`}
          icon={Milk}
          onClick={() => onNavigate('lecheria')}
          accent
        />
        <StatCard
          title="GANADO TOTAL"
          value={animals.length}
          subtitle={`${pregnantCows.length} en gestación`}
          icon={Binary}
          onClick={() => onNavigate('ganado')}
        />
        <StatCard
          title="VENTAS DEL DÍA"
          value={`$${salesMetrics?.todaySales.toFixed(2) || '0.00'}`}
          subtitle={`${salesMetrics?.todaySalesCount || 0} transacciones`}
          icon={Receipt}
          onClick={() => onNavigate('ventas')}
          accent
        />
        <StatCard
          title="INVENTARIO"
          value={inventory.length}
          subtitle={`${lowStockItems.length} alertas de stock`}
          icon={Boxes}
          onClick={() => onNavigate('inventario')}
        />
        <StatCard
          title="PRODUCTOS"
          value={productsCount}
          subtitle="Catálogo comercial"
          icon={ShoppingBag}
          onClick={() => onNavigate('productos')}
        />
        <StatCard
          title="MOVIMIENTOS DÍA"
          value={todayMovementsCount}
          subtitle="Entradas / Salidas"
          icon={ArrowLeftRight}
          onClick={() => onNavigate('inventario')}
        />
      </div>

      {/* Secondary Operational Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Operational Highlights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Clinical & Gestational Cattle Attention */}
          <div className="bg-[#101010] border border-[#242424] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
                <h3 className="text-xs font-bold tracking-wider text-[#FFFFFF] uppercase">
                  Estado Sanitario y Reproductivo
                </h3>
              </div>
              <button
                onClick={() => onNavigate('ganado')}
                className="text-xs text-[#C9A227] hover:text-[#E0C15A] flex items-center gap-1 font-medium"
              >
                Ver todo el ganado
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-[#141414] border border-[#242424]">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#A0A0A0] font-medium">Enfermería y Tratamientos</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    medicalCases.length > 0 ? 'bg-[#331818] text-[#FFA8A8]' : 'bg-[#182618] text-[#88D488]'
                  }`}>
                    {medicalCases.length} Casos
                  </span>
                </div>
                {medicalCases.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {medicalCases.map((m) => (
                      <div key={m.id} className="text-xs text-[#DDDDDD] flex justify-between">
                        <span>{m.code} - {m.name || m.breed}</span>
                        <span className="text-[#A0A0A0] text-[11px]">{m.location}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#707070] mt-2">Sin animales en tratamiento.</p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-[#141414] border border-[#242424]">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#A0A0A0] font-medium">Lote de Gestación / Maternidad</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18150B] text-[#C9A227] border border-[#3A3215]">
                    {pregnantCows.length} Hembras
                  </span>
                </div>
                {pregnantCows.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {pregnantCows.slice(0, 2).map((c) => (
                      <div key={c.id} className="text-xs text-[#DDDDDD] flex justify-between">
                        <span>{c.code} ({c.breed})</span>
                        <span className="text-[#C9A227] text-[11px]">{c.location}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#707070] mt-2">No hay hembras en gestación registradas.</p>
                )}
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-[#101010] border border-[#242424] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C9A227]" />
                <h3 className="text-xs font-bold tracking-wider text-[#FFFFFF] uppercase">
                  Alertas de Inventario
                </h3>
              </div>
              <button
                onClick={() => onNavigate('inventario')}
                className="text-xs text-[#C9A227] hover:text-[#E0C15A] flex items-center gap-1 font-medium"
              >
                Gestionar Almacén
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-[#808080] py-3 text-center">
                {inventory.length === 0
                  ? 'No hay insumos registrados todavía en el inventario.'
                  : 'Todos los insumos y alimentos se encuentran con stock normal.'}
              </p>
            ) : (
              <div className="divide-y divide-[#1C1C1C]">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#E0E0E0]">{item.name}</p>
                      <p className="text-[11px] text-[#777777]">{item.category} • {item.location}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'Agotado' ? 'bg-[#3A1414] text-[#FF8585]' : 'bg-[#2E2410] text-[#E0C15A]'
                      }`}>
                        {item.quantity} {item.unit} (Mín: {item.minStock})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Access & Recent Audit Log */}
        <div className="space-y-6">
          {/* Quick Operative Actions */}
          <div className="bg-[#101010] border border-[#242424] rounded-lg p-5">
            <h3 className="text-xs font-bold tracking-wider text-[#FFFFFF] uppercase mb-4 pb-2 border-b border-[#1E1E1E]">
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('lecheria')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#18150B] hover:bg-[#221D0E] border border-[#3A3215] text-xs font-semibold text-[#C9A227] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Milk className="w-4 h-4 text-[#C9A227]" />
                  <span>Registrar Ordeño de Vaca</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-[#C9A227]" />
              </button>

              <button
                onClick={() => onNavigate('ventas')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#282828] text-xs font-semibold text-[#D0D0D0] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#C9A227]" />
                  <span>Registrar Nueva Venta</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-[#C9A227]" />
              </button>

              <button
                onClick={() => onNavigate('ganado')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#282828] text-xs font-semibold text-[#D0D0D0] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Binary className="w-4 h-4 text-[#A0A0A0]" />
                  <span>Ficha de Alta de Ganado</span>
                </div>
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('inventario')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#282828] text-xs font-semibold text-[#D0D0D0] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowLeftRight className="w-4 h-4 text-[#A0A0A0]" />
                  <span>Movimiento de Insumos</span>
                </div>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recent System Activity Log */}
          <div className="bg-[#101010] border border-[#242424] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1E1E1E]">
              <h3 className="text-xs font-bold tracking-wider text-[#FFFFFF] uppercase">
                Actividad Reciente
              </h3>
              <button
                onClick={() => onNavigate('actividad')}
                className="text-xs text-[#C9A227] hover:text-[#E0C15A]"
              >
                Ver auditoría
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="text-xs border-l-2 border-[#C9A227] pl-3 py-1">
                  <p className="font-semibold text-[#EAEAEA]">{act.action}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#777777] mt-0.5">
                    <Clock className="w-3 h-3 text-[#C9A227]" />
                    <span>{act.time}</span>
                    <span>•</span>
                    <span className="text-[#A0A0A0]">{act.userName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
