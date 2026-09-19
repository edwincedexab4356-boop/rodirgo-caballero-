import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityService } from '../services/activityService';
import { ActivityLog } from '../types';
import {
  Activity,
  Search,
  Filter,
  User,
  Clock,
  Layers,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('Todos');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await activityService.getAll();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'Todos' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case 'Ganado':
        return 'bg-[#182315] text-[#81C784] border-[#294225]';
      case 'Inventario':
        return 'bg-[#231E12] text-[#E0C15A] border-[#44371C]';
      case 'Ventas':
        return 'bg-[#121E24] text-[#64B5F6] border-[#203642]';
      case 'Producción':
        return 'bg-[#241712] text-[#FFB74D] border-[#42291E]';
      case 'Seguridad':
        return 'bg-[#24121B] text-[#F06292] border-[#422030]';
      default:
        return 'bg-[#1A1A1A] text-[#AAAAAA] border-[#2A2A2A]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Bitácora de Auditoría y Actividad del Sistema
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Trazabilidad operacional inmutable: registro cronológico de quién hizo qué en la plataforma
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] text-[#E0C15A] border border-[#282828] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Actualizar Bitácora</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción o detalles..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#FAFAFA] placeholder-[#555555] outline-none"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full py-2 px-3 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#CCCCCC] outline-none"
          >
            <option value="Todos">Todos los módulos</option>
            <option value="Ganado">Ganado</option>
            <option value="Inventario">Inventario</option>
            <option value="Producción">Producción</option>
            <option value="Ventas">Ventas</option>
            <option value="Cierre Diario">Cierre Diario</option>
            <option value="Seguridad">Seguridad / Autenticación</option>
            <option value="Usuarios">Usuarios</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table (MANDATED BY SPEC 15) */}
      <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#121212] border-b border-[#202020] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
            <h3 className="text-xs font-bold text-[#EAEAEA] uppercase tracking-wider">
              Registro Histórico de Auditoría
            </h3>
          </div>
          <span className="text-[11px] text-[#777777]">
            {filteredLogs.length} eventos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141414] border-b border-[#222222] text-[#888888] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Usuario Responsable</th>
                <th className="py-3.5 px-4">Módulo Afectado</th>
                <th className="py-3.5 px-4">Acción Realizada</th>
                <th className="py-3.5 px-4">Detalles Operacionales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#777777]">
                    Cargando bitácora de auditoría...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#777777]">
                    No se encontraron eventos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3.5 px-4 font-mono text-[#888888] whitespace-nowrap">
                      {log.date} <span className="text-[#C9A227]">{log.time}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1A1A1A] border border-[#2D2D2D] flex items-center justify-center text-[10px] font-bold text-[#E0C15A]">
                          {log.userName.charAt(0)}
                        </div>
                        <span className="font-semibold text-[#FAFAFA]">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getModuleBadgeColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#E0E0E0] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A0] leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
