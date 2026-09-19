import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dairyService } from '../services/dairyService';
import { livestockService } from '../services/livestockService';
import { CowMilkingRecord, Animal } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Milk,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  User,
  Filter,
  ArrowUpDown,
  History,
  AlertCircle
} from 'lucide-react';

export const DairyPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CowMilkingRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'Todos' | 'Mañana' | 'Tarde'>('Todos');

  // Stats
  const [stats, setStats] = useState<{
    todayLiters: number;
    todayCowsCount: number;
    avgLitersPerCow: number;
    monthLiters: number;
    totalLitersAllTime: number;
    cowRankings: {
      cowCode: string;
      cowName?: string;
      totalLiters: number;
      recordsCount: number;
      avgLiters: number;
    }[];
  }>({
    todayLiters: 0,
    todayCowsCount: 0,
    avgLitersPerCow: 0,
    monthLiters: 0,
    totalLitersAllTime: 0,
    cowRankings: [],
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CowMilkingRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    cowCode: '',
    cowName: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'Mañana' as 'Mañana' | 'Tarde' | 'Completo',
    liters: '' as string | number,
    fatOrQuality: 'Grado A',
    milker: user?.fullName || 'Rodrigo Caballero',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRecords, allAnimals, dairyStats] = await Promise.all([
        dairyService.getRecords(),
        livestockService.getAll(),
        dairyService.getDairyStats(selectedDate),
      ]);
      setRecords(allRecords);
      setAnimals(allAnimals);
      setStats(dairyStats);
    } catch (err) {
      console.error('Error cargando datos de lechería:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData({
      cowCode: '',
      cowName: '',
      date: selectedDate,
      shift: 'Mañana',
      liters: '',
      fatOrQuality: 'Grado A',
      milker: user?.fullName || 'Rodrigo Caballero',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: CowMilkingRecord) => {
    setEditingRecord(rec);
    setFormData({
      cowCode: rec.cowCode,
      cowName: rec.cowName || '',
      date: rec.date,
      shift: rec.shift,
      liters: rec.liters,
      fatOrQuality: rec.fatOrQuality || 'Grado A',
      milker: rec.milker,
      notes: rec.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cowCode.trim() || !formData.liters) return;

    const numericLiters = Number(formData.liters);
    if (isNaN(numericLiters) || numericLiters < 0) return;

    try {
      if (editingRecord) {
        await dairyService.updateRecord(
          editingRecord.id,
          {
            cowCode: formData.cowCode.trim().toUpperCase(),
            cowName: formData.cowName.trim() || undefined,
            date: formData.date,
            shift: formData.shift,
            liters: numericLiters,
            fatOrQuality: formData.fatOrQuality,
            milker: formData.milker,
            notes: formData.notes,
          },
          user?.fullName
        );
      } else {
        await dairyService.addRecord(
          {
            cowCode: formData.cowCode.trim().toUpperCase(),
            cowName: formData.cowName.trim() || undefined,
            date: formData.date,
            shift: formData.shift,
            liters: numericLiters,
            fatOrQuality: formData.fatOrQuality,
            milker: formData.milker,
            notes: formData.notes,
          },
          user?.fullName
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error guardando registro de ordeño:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await dairyService.deleteRecord(deletingId, user?.fullName);
      setDeletingId(null);
      loadData();
    } catch (err) {
      console.error('Error eliminando ordeño:', err);
    }
  };

  // Autocompletar nombre si el arete ya existe en el censo ganadero
  const handleCowCodeChange = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const matchedAnimal = animals.find((a) => a.code.toUpperCase() === trimmed);
    setFormData((prev) => ({
      ...prev,
      cowCode: code,
      cowName: matchedAnimal?.name || prev.cowName,
    }));
  };

  // Filtrado de la tabla
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.cowCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.cowName && r.cowName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.milker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || r.date === selectedDate;
    const matchesShift = shiftFilter === 'Todos' || r.shift === shiftFilter;
    return matchesSearch && matchesDate && matchesShift;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner - Flat Matte Dark Styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F] border border-[#242424] p-5 rounded-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1A1810] border border-[#3A331A] rounded-md text-[#C9A227]">
              <Milk className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
                Control Lechero & Producción por Vaca
              </h2>
              <p className="text-xs text-[#8A8A8A] mt-0.5">
                Seguimiento individual de litros por vaca, balance diario y rendimiento de la sala de ordeño
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#D4AF37] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Ordeño</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics - Flat Solid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Litros Hoy */}
        <div className="bg-[#121212] border border-[#262626] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
              Total Leche Hoy
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C180B] text-[#C9A227] border border-[#3A3215] font-mono">
              {selectedDate}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#FFFFFF] tracking-tight font-mono">
              {stats.todayLiters.toLocaleString()}
            </span>
            <span className="text-xs text-[#C9A227] font-semibold">Litros</span>
          </div>
          <p className="text-[11px] text-[#707070] mt-1">
            Producción registrada en el día seleccionado
          </p>
        </div>

        {/* Metric 2: Vacas Ordeñadas Hoy */}
        <div className="bg-[#121212] border border-[#262626] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
              Vacas Ordeñadas
            </span>
            <User className="w-4 h-4 text-[#8A8A8A]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#FFFFFF] tracking-tight font-mono">
              {stats.todayCowsCount}
            </span>
            <span className="text-xs text-[#8A8A8A]">ejemplares</span>
          </div>
          <p className="text-[11px] text-[#707070] mt-1">
            Vacas activas en la sala hoy
          </p>
        </div>

        {/* Metric 3: Promedio Litros / Vaca */}
        <div className="bg-[#121212] border border-[#262626] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
              Promedio por Vaca
            </span>
            <ArrowUpDown className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#FFFFFF] tracking-tight font-mono">
              {stats.avgLitersPerCow}
            </span>
            <span className="text-xs text-[#C9A227]">L / vaca</span>
          </div>
          <p className="text-[11px] text-[#707070] mt-1">
            Rendimiento individual promedio hoy
          </p>
        </div>

        {/* Metric 4: Total Mes Acumulado */}
        <div className="bg-[#121212] border border-[#262626] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
              Total Mes en Curso
            </span>
            <Calendar className="w-4 h-4 text-[#8A8A8A]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#FFFFFF] tracking-tight font-mono">
              {stats.monthLiters.toLocaleString()}
            </span>
            <span className="text-xs text-[#8A8A8A]">Litros</span>
          </div>
          <p className="text-[11px] text-[#707070] mt-1">
            Litros acumulados en el mes
          </p>
        </div>
      </div>

      {/* Grid with 2 Columns: Rankings by Cow & Daily Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Dairy Cows Ranking */}
        <div className="bg-[#101010] border border-[#242424] rounded-lg p-5 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-[#202020] mb-4">
            <div className="flex items-center gap-2">
              <Milk className="w-4 h-4 text-[#C9A227]" />
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
                Producción por Vaca (Histórico)
              </h3>
            </div>
            <span className="text-[10px] text-[#707070] font-mono">
              {stats.cowRankings.length} vacas
            </span>
          </div>

          {stats.cowRankings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <Milk className="w-8 h-8 text-[#333333] mb-2" />
              <p className="text-xs text-[#707070]">No hay registros de ordeño aún.</p>
              <p className="text-[11px] text-[#555555] mt-1">
                Registra la producción de tus vacas con el botón superior.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
              {stats.cowRankings.map((cow, index) => (
                <div
                  key={cow.cowCode}
                  className="p-3 bg-[#161616] border border-[#242424] rounded-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-[#1F1F1F] border border-[#333333] flex items-center justify-center text-[10px] font-mono font-bold text-[#C9A227]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#FFFFFF]">
                        Arete: {cow.cowCode}
                      </p>
                      <p className="text-[10px] text-[#8A8A8A]">
                        {cow.cowName || 'Sin nombre asignado'} • {cow.recordsCount} ordeño(s)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-[#C9A227]">
                      {cow.totalLiters} L
                    </p>
                    <p className="text-[10px] text-[#707070] font-mono">
                      Prom: {cow.avgLiters} L/ord
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Daily Detailed Records Table with Filters */}
        <div className="lg:col-span-2 bg-[#101010] border border-[#242424] rounded-lg p-5 flex flex-col">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#202020] mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C9A227]" />
              <label className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
                Fecha del Ordeño:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="py-1 px-2 bg-[#161616] border border-[#2E2E2E] focus:border-[#C9A227] rounded text-xs text-[#FFFFFF] outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#707070]" />
                <input
                  type="text"
                  placeholder="Buscar arete o vaca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-[#161616] border border-[#2E2E2E] focus:border-[#C9A227] rounded text-xs text-[#FFFFFF] outline-none"
                />
              </div>

              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value as any)}
                className="py-1 px-2 bg-[#161616] border border-[#2E2E2E] focus:border-[#C9A227] rounded text-xs text-[#C0C0C0] outline-none"
              >
                <option value="Todos">Turnos: Todos</option>
                <option value="Mañana">Turno Mañana</option>
                <option value="Tarde">Turno Tarde</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161616] text-[#8A8A8A] uppercase text-[10px] tracking-wider border-b border-[#242424]">
                <tr>
                  <th className="py-2.5 px-3">Arete / Vaca</th>
                  <th className="py-2.5 px-3">Turno</th>
                  <th className="py-2.5 px-3 text-right">Litros</th>
                  <th className="py-2.5 px-3">Calidad</th>
                  <th className="py-2.5 px-3">Ordeñador</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D1D]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#707070]">
                      Cargando registros de lechería...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#707070]">
                      No hay registros de ordeño para la fecha seleccionada ({selectedDate}).
                      <div className="mt-2">
                        <button
                          onClick={handleOpenCreate}
                          className="text-xs text-[#C9A227] hover:underline font-semibold"
                        >
                          + Registrar primer ordeño de esta fecha
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#161616] transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#FFFFFF] font-mono">
                          {rec.cowCode}
                        </span>
                        {rec.cowName && (
                          <span className="block text-[11px] text-[#8A8A8A]">
                            {rec.cowName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            rec.shift === 'Mañana'
                              ? 'bg-[#1C180B] text-[#C9A227] border border-[#3A3215]'
                              : 'bg-[#181818] text-[#B0B0B0] border border-[#2E2E2E]'
                          }`}
                        >
                          {rec.shift}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#FFFFFF]">
                        {rec.liters} L
                      </td>
                      <td className="py-3 px-3 text-[#B0B0B0]">
                        {rec.fatOrQuality || 'Grado A'}
                      </td>
                      <td className="py-3 px-3 text-[#8A8A8A] truncate max-w-[120px]">
                        {rec.milker}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 rounded hover:bg-[#202020] text-[#A0A0A0] hover:text-[#C9A227] transition-colors"
                          title="Modificar registro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(rec.id)}
                          className="p-1.5 rounded hover:bg-[#202020] text-[#A0A0A0] hover:text-[#E57373] transition-colors"
                          title="Eliminar registro"
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
      </div>

      {/* Modal: Registrar / Modificar Ordeño */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Editar Registro de Ordeño' : 'Registrar Nuevo Ordeño'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Arete / Código de la Vaca *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. V-101, SB-04"
                value={formData.cowCode}
                onChange={(e) => handleCowCodeChange(e.target.value)}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Nombre de la Vaca (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Margarita, La Pinta"
                value={formData.cowName}
                onChange={(e) => setFormData({ ...formData, cowName: e.target.value })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Fecha del Ordeño *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Turno de Ordeño *
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Mañana">Mañana (Matutino)</option>
                <option value="Tarde">Tarde (Vespertino)</option>
                <option value="Completo">Jornada Completa</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Litros Obtenidos *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="Ej. 14.5"
                value={formData.liters}
                onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Calidad / Grado
              </label>
              <select
                value={formData.fatOrQuality}
                onChange={(e) => setFormData({ ...formData, fatOrQuality: e.target.value })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Grado A">Grado A (Excelente)</option>
                <option value="Grado B">Grado B (Estándar)</option>
                <option value="Calostro">Calostro (Uso Cría)</option>
                <option value="Observación">En Observación</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Ordeñador / Responsable
              </label>
              <input
                type="text"
                value={formData.milker}
                onChange={(e) => setFormData({ ...formData, milker: e.target.value })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Notas / Observaciones
              </label>
              <textarea
                rows={2}
                placeholder="Comportamiento, ubre, suplemento suministrado..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#202020]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#A0A0A0] font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#C9A227] hover:bg-[#D4AF37] text-[#0A0A0A] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              {editingRecord ? 'Actualizar Ordeño' : 'Guardar Ordeño'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Registro de Ordeño"
        message="¿Está seguro de que desea eliminar permanentemente este registro de ordeño? Esta acción descontará los litros del balance diario e histórico."
        confirmText="Eliminar"
        isDestructive
      />
    </div>
  );
};
