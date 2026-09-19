import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productionService } from '../services/productionService';
import { ProductionRecord, ProductionType } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  TrendingUp,
  Plus,
  Calendar,
  Layers,
  Clock,
  UserCheck,
  Milk,
  BarChart3,
  FileSpreadsheet,
  Trash2,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const ProductionPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<'diaria' | 'semanal' | 'mensual'>('diaria');

  // Modals & Delete
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Leche' as ProductionType,
    quantity: 580,
    unit: 'Litros',
    shift: 'Mañana' as ProductionRecord['shift'],
    responsible: user?.fullName || 'Rodrigo Caballero',
    observations: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productionService.getAll();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await productionService.addRecord(formData, user?.fullName || 'Rodrigo Caballero');
    setIsAddOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await productionService.deleteRecord(deletingId, user?.fullName || 'Rodrigo Caballero');
    setDeletingId(null);
    loadData();
  };

  // Filter records based on scope
  const todayStr = new Date().toISOString().split('T')[0];
  const weekAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const filteredRecords = records.filter((r) => {
    if (viewScope === 'diaria') return r.date === todayStr;
    if (viewScope === 'semanal') return r.date >= weekAgoStr;
    return r.date >= monthAgoStr;
  });

  // Calculate totals
  const totalMilk = filteredRecords
    .filter((r) => r.type === 'Leche')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const totalCheese = filteredRecords
    .filter((r) => r.type === 'Queso Artesanal')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  // Chart data: daily milk trend
  const chartData = [...records]
    .filter((r) => r.type === 'Leche')
    .slice(0, 10)
    .reverse()
    .map((r) => ({
      date: r.date.slice(5),
      litros: r.quantity,
    }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Control General de Producción
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Lotes globales de ordeño, pesajes de carne y subproductos de la hacienda
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#D4AF37] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Lote</span>
          </button>
        </div>
      </div>

      {/* Scope Selector & Quick Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Scope Selector */}
        <div className="bg-[#101010] border border-[#222222] p-4 rounded-lg flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">
            Filtro Temporal
          </p>
          <div className="flex rounded bg-[#161616] p-1 border border-[#262626]">
            <button
              onClick={() => setViewScope('diaria')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewScope === 'diaria' ? 'bg-[#C9A227] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FFFFFF]'
              }`}
            >
              Diaria
            </button>
            <button
              onClick={() => setViewScope('semanal')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewScope === 'semanal' ? 'bg-[#C9A227] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FFFFFF]'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewScope('mensual')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewScope === 'mensual' ? 'bg-[#C9A227] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FFFFFF]'
              }`}
            >
              Mes
            </button>
          </div>
        </div>

        {/* Leche Total */}
        <div className="bg-[#101010] border border-[#222222] p-4 rounded-lg">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Leche Acumulada</span>
            <Milk className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#FFFFFF] font-mono">
              {totalMilk.toLocaleString()}
            </span>
            <span className="text-xs text-[#C9A227]">Litros</span>
          </div>
        </div>

        {/* Queso Artesanal */}
        <div className="bg-[#101010] border border-[#222222] p-4 rounded-lg">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Queso / Lácteos</span>
            <Layers className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#FFFFFF] font-mono">
              {totalCheese.toLocaleString()}
            </span>
            <span className="text-xs text-[#C9A227]">Kilos</span>
          </div>
        </div>

        {/* Total Lotes Registrados */}
        <div className="bg-[#101010] border border-[#222222] p-4 rounded-lg">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Lotes Registrados</span>
            <Calendar className="w-4 h-4 text-[#888888]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#FFFFFF] font-mono">
              {filteredRecords.length}
            </span>
            <span className="text-xs text-[#888888]">turnos</span>
          </div>
        </div>
      </div>

      {/* Production Chart (If data exists) */}
      {chartData.length > 0 && (
        <div className="bg-[#101010] border border-[#222222] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C9A227]" />
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
                Curva de Rendimiento Lechero
              </h3>
            </div>
            <span className="text-[11px] text-[#707070] font-mono">Histórico reciente</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A227" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis dataKey="date" stroke="#666666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666666" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161616',
                    borderColor: '#333333',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="litros"
                  name="Litros de Leche"
                  stroke="#C9A227"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#goldArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Production Records Table */}
      <div className="bg-[#101010] border border-[#222222] rounded-lg overflow-hidden">
        <div className="p-4 bg-[#141414] border-b border-[#202020] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#EAEAEA] uppercase tracking-wider">
            Planilla de Lotes de Producción
          </h3>
          <span className="text-[11px] text-[#888888]">
            {filteredRecords.length} lote(s) en este período
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#161616] border-b border-[#222222] text-[#888888] uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Turno</th>
                <th className="py-3 px-4 font-mono">Cantidad</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Observaciones</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#777777]">
                    No hay lotes de producción registrados en este período.
                    <div className="mt-2">
                      <button
                        onClick={() => setIsAddOpen(true)}
                        className="text-xs text-[#C9A227] hover:underline font-semibold"
                      >
                        + Registrar el primer lote
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3 px-4 font-mono text-[#A0A0A0]">{rec.date}</td>
                    <td className="py-3 px-4 font-semibold text-[#FAFAFA]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1A1A1A] border border-[#2B2B2B] text-[#CCCCCC]">
                        {rec.shift}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#C9A227]">
                      {rec.quantity} {rec.unit}
                    </td>
                    <td className="py-3 px-4 text-[#A0A0A0]">{rec.responsible}</td>
                    <td className="py-3 px-4 text-[#777777] max-w-xs truncate">{rec.observations || 'Sin novedades'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeletingId(rec.id)}
                        className="p-1.5 rounded hover:bg-[#222222] text-[#888888] hover:text-[#E57373] transition-colors cursor-pointer"
                        title="Eliminar lote de producción"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Production Record */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Registrar Lote de Producción"
        subtitle="Ingreso de ordeño, pesaje cárnico o subproductos"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Turno de Trabajo
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value as ProductionRecord['shift'] })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Mañana">Mañana (Madrugada)</option>
                <option value="Tarde">Tarde</option>
                <option value="Jornada Completa">Jornada Completa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Tipo de Producción
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const val = e.target.value as ProductionType;
                  let defUnit = 'Litros';
                  if (val === 'Carne / Ceba' || val === 'Queso Artesanal') defUnit = 'Kilos';
                  if (val === 'Genética / Pajillas') defUnit = 'Pajillas';
                  setFormData({ ...formData, type: val, unit: defUnit });
                }}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Leche">Leche</option>
                <option value="Queso Artesanal">Queso Artesanal</option>
                <option value="Carne / Ceba">Carne / Ceba</option>
                <option value="Genética / Pajillas">Genética / Pajillas</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Cantidad *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                  className="flex-1 py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none font-mono font-bold"
                />
                <span className="py-2 px-3 bg-[#1A1A1A] border border-[#282828] rounded-lg text-xs text-[#A0A0A0]">
                  {formData.unit}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Responsable de Operación
            </label>
            <input
              type="text"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              required
              className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Observaciones (Sala de ordeño, tanques, calidad...)
            </label>
            <textarea
              rows={3}
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Detalles sobre temperatura de enfriamiento, sanidad de ubres, etc."
              className="w-full p-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#8E8E8E] hover:text-[#FFFFFF] bg-[#141414] rounded-lg border border-[#242424]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#C9A227] hover:bg-[#D4AF37] rounded-lg cursor-pointer"
            >
              Guardar Lote
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Eliminar Lote de Producción"
        message="¿Está seguro de que desea eliminar este lote de producción? La cantidad será descontada del total acumulado."
        confirmText="Eliminar Lote"
        isDestructive
      />
    </div>
  );
};
