import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dailyCloseService } from '../services/dailyCloseService';
import { DailyClose } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  CalendarCheck2,
  Receipt,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Binary,
  UserCheck,
  CheckCircle2,
  Printer,
  Calendar,
  FileText,
  Clock
} from 'lucide-react';

export const DailyClosePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<any>(null);
  const [historicalCloses, setHistoricalCloses] = useState<DailyClose[]>([]);
  const [loading, setLoading] = useState(true);

  // Close modal & confirm
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');

  const loadDailyData = async (date: string) => {
    setLoading(true);
    try {
      const [sum, closes] = await Promise.all([
        dailyCloseService.getSummaryForDate(date),
        dailyCloseService.getAll(),
      ]);
      setSummary(sum);
      setHistoricalCloses(closes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  const handleExecuteClose = async (e: React.FormEvent) => {
    e.preventDefault();
    await dailyCloseService.closeDay(
      selectedDate,
      user?.fullName || 'Administrador General',
      closeNotes || 'Jornada operacional concluida y auditada.'
    );
    setIsCloseModalOpen(false);
    setCloseNotes('');
    loadDailyData(selectedDate);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              RESUMEN DEL DÍA — Cierre Operacional
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Consolidado diario de ventas, ordeño, despachos, movimientos de ganado y almacén
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#141414] border border-[#282828] px-3 py-1.5 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-[#E0E0E0] outline-none"
            />
          </div>

          <button
            onClick={handlePrint}
            className="p-2 bg-[#141414] hover:bg-[#1E1E1E] text-[#C9A227] border border-[#282828] rounded-lg transition-colors"
            title="Imprimir resumen oficial"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#777777]">
          Consolidando datos del cierre diario...
        </div>
      ) : (
        <>
          {/* Daily Status Alert Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            summary.isClosed
              ? 'bg-[#121A13] border-[#25462A] text-[#A5D6A7]'
              : 'bg-[#17140B] border-[#443818] text-[#E0C15A]'
          }`}>
            <div className="flex items-center gap-3">
              {summary.isClosed ? (
                <CheckCircle2 className="w-5 h-5 text-[#81C784]" />
              ) : (
                <Clock className="w-5 h-5 text-[#C9A227]" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {summary.isClosed
                    ? `Día Oficialmente Cerrado el ${summary.existingClose?.date} a las ${summary.existingClose?.closedAt}`
                    : `Jornada del ${selectedDate} en Curso (Abierta)`}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {summary.isClosed
                    ? `Auditado y firmado por: ${summary.existingClose?.closedBy}`
                    : 'Las transacciones y pesajes continúan registrándose en tiempo real.'}
                </p>
              </div>
            </div>

            {!summary.isClosed && user?.role === 'ADMINISTRADOR' && (
              <button
                onClick={() => setIsCloseModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                Cerrar Jornada Oficial
              </button>
            )}
          </div>

          {/* Core Daily Metrics Grid (MANDATED BY SPEC 13) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Ventas & Cantidad */}
            <div className="bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A0A0A0] uppercase">
                  Total de Ventas
                </span>
                <Receipt className="w-4 h-4 text-[#C9A227]" />
              </div>
              <p className="text-2xl font-bold text-[#E0C15A] font-mono mt-2">
                ${summary.totalSales.toFixed(2)}
              </p>
              <p className="text-[11px] text-[#777777] mt-1">
                {summary.salesCount} comprobantes facturados
              </p>
            </div>

            {/* Producción Registrada */}
            <div className="bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A0A0A0] uppercase">
                  Producción Registrada
                </span>
                <TrendingUp className="w-4 h-4 text-[#C9A227]" />
              </div>
              <div className="mt-2 space-y-0.5">
                {summary.productionSummary.length === 0 ? (
                  <p className="text-xs text-[#777777]">Sin producción registrada</p>
                ) : (
                  summary.productionSummary.map((p: any) => (
                    <p key={p.type} className="text-sm font-bold text-[#FFFFFF] font-mono">
                      {p.total} <span className="text-xs font-normal text-[#C9A227]">{p.unit} ({p.type})</span>
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Entradas y Salidas de Inventario */}
            <div className="bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A0A0A0] uppercase">
                  Almacén e Insumos
                </span>
                <div className="flex gap-1 text-[#C9A227]">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-lg font-bold text-[#81C784] font-mono">
                    +{summary.inventoryEntries}
                  </p>
                  <p className="text-[10px] text-[#777777] uppercase">Entradas</p>
                </div>
                <div className="w-[1px] h-8 bg-[#222222]" />
                <div>
                  <p className="text-lg font-bold text-[#FF8A80] font-mono">
                    -{summary.inventoryExits}
                  </p>
                  <p className="text-[10px] text-[#777777] uppercase">Salidas</p>
                </div>
              </div>
            </div>

            {/* Movimientos de Ganado */}
            <div className="bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A0A0A0] uppercase">
                  Movimientos de Ganado
                </span>
                <Binary className="w-4 h-4 text-[#C9A227]" />
              </div>
              <p className="text-2xl font-bold text-[#FFFFFF] font-mono mt-2">
                {summary.livestockMovements}
              </p>
              <p className="text-[11px] text-[#777777] mt-1">
                Fichas clínicas o cambios de potrero
              </p>
            </div>
          </div>

          {/* Detailed Lists Breakdown for the Day */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Sales Breakdown */}
            <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-5">
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider mb-3 pb-2 border-b border-[#1E1E1E] flex items-center justify-between">
                <span>Detalle de Ventas del Día</span>
                <span className="text-[#E0C15A] font-mono">${summary.totalSales.toFixed(2)}</span>
              </h3>
              {summary.daySales.length === 0 ? (
                <p className="text-xs text-[#777777] py-4 text-center">No hubo ventas registradas en esta fecha.</p>
              ) : (
                <div className="divide-y divide-[#1A1A1A]">
                  {summary.daySales.map((s: any) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#EEEEEE]">{s.productName}</p>
                        <p className="text-[11px] text-[#777777]">
                          {s.quantity} {s.unit} • Cliente: {s.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-[#E0C15A]">${s.total.toFixed(2)}</p>
                        <p className="text-[10px] text-[#666666]">{s.registeredBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Operations and Users Involved */}
            <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-5">
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider mb-3 pb-2 border-b border-[#1E1E1E]">
                Movimientos y Operadores Responsables
              </h3>
              {summary.dayActivities.length === 0 ? (
                <p className="text-xs text-[#777777] py-4 text-center">Sin actividad registrada en esta fecha.</p>
              ) : (
                <div className="space-y-2.5">
                  {summary.dayActivities.map((act: any) => (
                    <div key={act.id} className="p-2.5 rounded-lg bg-[#141414] border border-[#202020] text-xs flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[#E0E0E0]">{act.action}</p>
                        <p className="text-[11px] text-[#888888]">{act.details || act.module}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-[11px] text-[#C9A227] font-medium">{act.userName}</span>
                        <p className="text-[10px] text-[#666666]">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historical Closes Table */}
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-5">
            <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider mb-3 pb-2 border-b border-[#1E1E1E]">
              Histórico de Cierres Diarios Certificados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#222222] text-[#888888] uppercase">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Total Ventas</th>
                    <th className="py-2.5 px-3">Ventas #</th>
                    <th className="py-2.5 px-3">Mov. Almacén</th>
                    <th className="py-2.5 px-3">Cerrado Por</th>
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {historicalCloses.map((c) => (
                    <tr key={c.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#E0C15A]">{c.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#FAFAFA]">${c.totalSales.toFixed(2)}</td>
                      <td className="py-2.5 px-3">{c.salesCount}</td>
                      <td className="py-2.5 px-3">{c.inventoryEntries + c.inventoryExits}</td>
                      <td className="py-2.5 px-3">{c.closedBy}</td>
                      <td className="py-2.5 px-3 font-mono text-[#888888]">{c.closedAt}</td>
                      <td className="py-2.5 px-3 text-[#777777] max-w-xs truncate">{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Confirm Close Day */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title={`Cierre Oficial de la Jornada: ${selectedDate}`}
        subtitle="Consolidará los registros y firmará el acta operativa del día"
        maxWidth="md"
      >
        <form onSubmit={handleExecuteClose} className="space-y-4">
          <div className="p-3 bg-[#17140B] border border-[#3E351B] rounded-lg text-xs text-[#E0C15A] leading-relaxed">
            Se generará el balance consolidado del día con <strong>${summary?.totalSales.toFixed(2)}</strong> en ventas y <strong>{summary?.productionSummary.length}</strong> lotes de producción.
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Notas u Observaciones del Cierre Diario
            </label>
            <textarea
              rows={3}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Ej. Jornada concluida sin incidentes sanitarios. Buen rendimiento lechero..."
              className="w-full p-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => setIsCloseModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#8E8E8E] hover:text-[#FFFFFF] bg-[#141414] rounded-lg border border-[#242424]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#C9A227] hover:bg-[#E0C15A] rounded-lg cursor-pointer"
            >
              Confirmar Cierre Diario
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
