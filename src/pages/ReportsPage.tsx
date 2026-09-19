import React, { useState, useEffect } from 'react';
import { livestockService } from '../services/livestockService';
import { inventoryService } from '../services/inventoryService';
import { productionService } from '../services/productionService';
import { salesService } from '../services/salesService';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Layers,
  TrendingUp,
  Receipt,
  Boxes,
  Binary
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'ventas' | 'produccion' | 'inventario' | 'ganado'>('ventas');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState('Todas');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (reportType === 'ventas') {
        const sales = await salesService.getAll();
        const filtered = sales.filter((s) => s.date >= startDate && s.date <= endDate);
        setData(filtered);
      } else if (reportType === 'produccion') {
        const prods = await productionService.getAll();
        const filtered = prods.filter(
          (p) =>
            p.date >= startDate &&
            p.date <= endDate &&
            (filterCategory === 'Todas' || p.type === filterCategory)
        );
        setData(filtered);
      } else if (reportType === 'inventario') {
        const inv = await inventoryService.getAll();
        const filtered = inv.filter(
          (i) => filterCategory === 'Todas' || i.category === filterCategory
        );
        setData(filtered);
      } else if (reportType === 'ganado') {
        const animals = await livestockService.getAll();
        const filtered = animals.filter(
          (a) => filterCategory === 'Todas' || a.status === filterCategory || a.breed === filterCategory
        );
        setData(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [reportType, startDate, endDate, filterCategory]);

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_${reportType}_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Informes, Resúmenes y Reportería Oficial
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Generación de reportes ejecutivos con filtros por rangos de fecha y exportación de datos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-[#181611] hover:bg-[#221F14] text-[#E0C15A] border border-[#3E351B] font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#C9A227]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setReportType('ventas');
            setFilterCategory('Todas');
          }}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            reportType === 'ventas'
              ? 'bg-[#18150D] border-[#C9A227] text-[#FFFFFF]'
              : 'bg-[#0D0D0D] border-[#202020] text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Receipt className={`w-5 h-5 ${reportType === 'ventas' ? 'text-[#C9A227]' : 'text-[#666666]'}`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Ventas</p>
            <p className="text-[10px] text-[#777777]">Comercialización</p>
          </div>
        </button>

        <button
          onClick={() => {
            setReportType('produccion');
            setFilterCategory('Todas');
          }}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            reportType === 'produccion'
              ? 'bg-[#18150D] border-[#C9A227] text-[#FFFFFF]'
              : 'bg-[#0D0D0D] border-[#202020] text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${reportType === 'produccion' ? 'text-[#C9A227]' : 'text-[#666666]'}`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Producción</p>
            <p className="text-[10px] text-[#777777]">Ordeño y pesajes</p>
          </div>
        </button>

        <button
          onClick={() => {
            setReportType('inventario');
            setFilterCategory('Todas');
          }}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            reportType === 'inventario'
              ? 'bg-[#18150D] border-[#C9A227] text-[#FFFFFF]'
              : 'bg-[#0D0D0D] border-[#202020] text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Boxes className={`w-5 h-5 ${reportType === 'inventario' ? 'text-[#C9A227]' : 'text-[#666666]'}`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Inventario</p>
            <p className="text-[10px] text-[#777777]">Almacén e insumos</p>
          </div>
        </button>

        <button
          onClick={() => {
            setReportType('ganado');
            setFilterCategory('Todas');
          }}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            reportType === 'ganado'
              ? 'bg-[#18150D] border-[#C9A227] text-[#FFFFFF]'
              : 'bg-[#0D0D0D] border-[#202020] text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Binary className={`w-5 h-5 ${reportType === 'ganado' ? 'text-[#C9A227]' : 'text-[#666666]'}`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Ganado</p>
            <p className="text-[10px] text-[#777777]">Censo pecuario</p>
          </div>
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl flex flex-wrap items-center gap-4 text-xs">
        {/* Date Range (For ventas & produccion) */}
        {(reportType === 'ventas' || reportType === 'produccion') && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
            <span className="text-[#888888]">Rango:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1 px-2 bg-[#141414] border border-[#282828] rounded text-[#DDDDDD] outline-none"
            />
            <span className="text-[#666666]">hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1 px-2 bg-[#141414] border border-[#282828] rounded text-[#DDDDDD] outline-none"
            />
          </div>
        )}

        {/* Category filter depending on report type */}
        {reportType === 'produccion' && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#C9A227]" />
            <span className="text-[#888888]">Tipo:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-1 px-2.5 bg-[#141414] border border-[#282828] rounded text-[#CCCCCC] outline-none"
            >
              <option value="Todas">Todos los tipos</option>
              <option value="Leche">Leche</option>
              <option value="Queso Artesanal">Queso Artesanal</option>
              <option value="Carne / Ceba">Carne / Ceba</option>
              <option value="Genética / Pajillas">Genética / Pajillas</option>
            </select>
          </div>
        )}

        {reportType === 'inventario' && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#C9A227]" />
            <span className="text-[#888888]">Categoría:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-1 px-2.5 bg-[#141414] border border-[#282828] rounded text-[#CCCCCC] outline-none"
            >
              <option value="Todas">Todas las categorías</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Medicamentos">Medicamentos</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Insumos">Insumos</option>
              <option value="Equipos">Equipos</option>
            </select>
          </div>
        )}

        {reportType === 'ganado' && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#C9A227]" />
            <span className="text-[#888888]">Estado de Salud:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-1 px-2.5 bg-[#141414] border border-[#282828] rounded text-[#CCCCCC] outline-none"
            >
              <option value="Todas">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Gestación">Gestación</option>
              <option value="En Tratamiento">En Tratamiento</option>
              <option value="Cuarentena">Cuarentena</option>
              <option value="Vendido">Vendido</option>
            </select>
          </div>
        )}

        <div className="ml-auto text-[#777777]">
          {data.length} registros filtrados
        </div>
      </div>

      {/* Report Table Display */}
      <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#121212] border-b border-[#202020] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#EAEAEA] uppercase tracking-wider">
            Informe Detallado: {reportType.toUpperCase()}
          </h3>
          <span className="text-[11px] font-mono text-[#E0C15A]">
            Generado: {new Date().toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'ventas' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141414] border-b border-[#222222] text-[#888888] uppercase">
                  <th className="py-3 px-4">N° Factura</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Cantidad</th>
                  <th className="py-3 px-4">Precio Unit.</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#E0C15A]">{item.saleNumber}</td>
                    <td className="py-3 px-4 font-mono">{item.date}</td>
                    <td className="py-3 px-4 font-semibold text-[#FAFAFA]">{item.productName}</td>
                    <td className="py-3 px-4">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-4 font-mono">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E0C15A]">${item.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-[#D0D0D0]">{item.customerName}</td>
                    <td className="py-3 px-4 text-[#888888]">{item.registeredBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'produccion' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141414] border-b border-[#222222] text-[#888888] uppercase">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Turno</th>
                  <th className="py-3 px-4">Cantidad</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3 px-4 font-mono">{item.date}</td>
                    <td className="py-3 px-4 font-semibold text-[#FAFAFA]">{item.type}</td>
                    <td className="py-3 px-4">{item.shift}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E0C15A]">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-4">{item.responsible}</td>
                    <td className="py-3 px-4 text-[#888888] max-w-sm truncate">{item.observations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'inventario' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141414] border-b border-[#222222] text-[#888888] uppercase">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Cantidad</th>
                  <th className="py-3 px-4">Stock Mínimo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Costo Ref.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3 px-4 font-semibold text-[#FAFAFA]">{item.name}</td>
                    <td className="py-3 px-4 text-[#A0A0A0]">{item.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E0C15A]">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-4 font-mono text-[#888888]">{item.minStock} {item.unit}</td>
                    <td className="py-3 px-4">{item.status}</td>
                    <td className="py-3 px-4">{item.location}</td>
                    <td className="py-3 px-4 font-mono">${item.costPerUnit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'ganado' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141414] border-b border-[#222222] text-[#888888] uppercase">
                  <th className="py-3 px-4">Código / Arete</th>
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Raza</th>
                  <th className="py-3 px-4">Sexo</th>
                  <th className="py-3 px-4">Edad</th>
                  <th className="py-3 px-4">Peso</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#E0C15A]">{item.code}</td>
                    <td className="py-3 px-4 font-semibold text-[#FAFAFA]">{item.name || 'Sin nombre'}</td>
                    <td className="py-3 px-4">{item.breed}</td>
                    <td className="py-3 px-4">{item.sex}</td>
                    <td className="py-3 px-4">{item.ageMonths}m</td>
                    <td className="py-3 px-4 font-mono">{item.weightKg} kg</td>
                    <td className="py-3 px-4">{item.location}</td>
                    <td className="py-3 px-4">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
