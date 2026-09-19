import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesService, SalesMetrics } from '../services/salesService';
import { productsService } from '../services/productsService';
import { Sale, Product } from '../types';
import { Modal } from '../components/ui/Modal';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  FileCheck2
} from 'lucide-react';

export const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    productName: '',
    quantity: 1,
    unit: 'Litros',
    unitPrice: 0.95,
    customerName: '',
    paymentMethod: 'Transferencia' as Sale['paymentMethod'],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSales, allProducts, allMetrics] = await Promise.all([
        salesService.getAll(),
        productsService.getAll(),
        salesService.getMetrics(),
      ]);
      setSales(allSales);
      setProducts(allProducts);
      setMetrics(allMetrics);

      if (allProducts.length > 0 && !formData.productId) {
        setFormData((prev) => ({
          ...prev,
          productId: allProducts[0].id,
          productName: allProducts[0].name,
          unit: allProducts[0].unit,
          unitPrice: allProducts[0].price,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductChange = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setFormData({
        ...formData,
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        unitPrice: prod.price,
      });
    }
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) return;

    const total = formData.quantity * formData.unitPrice;
    await salesService.addSale(
      {
        date: formData.date,
        productId: formData.productId,
        productName: formData.productName,
        quantity: formData.quantity,
        unit: formData.unit,
        unitPrice: formData.unitPrice,
        total,
        customerName: formData.customerName,
        paymentMethod: formData.paymentMethod,
        registeredBy: user?.fullName || 'Operador',
      },
      user?.fullName || 'Operador'
    );

    setIsAddOpen(false);
    loadData();
  };

  const filteredSales = sales.filter((s) =>
    s.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registeredBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Control de Ventas y Facturación Agropecuaria
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Registro comercial de despachos, pedidos de leche, carne, pie de cría y derivados
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md shadow-[#C9A227]/10 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Venta</span>
        </button>
      </div>

      {/* Automatic Financial Metrics Row (MANDATED BY SPEC 12) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* VENTAS DEL DÍA */}
        <div className="bg-[#0D0D0D] border border-[#C9A227]/40 rounded-xl p-4 shadow-lg shadow-[#C9A227]/5">
          <p className="text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider">
            VENTAS DEL DÍA
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-[#E0C15A] font-mono mt-1">
            ${metrics?.todaySales.toFixed(2) || '0.00'}
          </p>
          <p className="text-[10px] text-[#777777] mt-1">
            {metrics?.todaySalesCount || 0} ventas registradas hoy
          </p>
        </div>

        {/* VENTAS DE LA SEMANA */}
        <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider">
            VENTAS DE LA SEMANA
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-[#FFFFFF] font-mono mt-1">
            ${metrics?.weekSales.toFixed(2) || '0.00'}
          </p>
          <p className="text-[10px] text-[#777777] mt-1">
            Últimos 7 días móviles
          </p>
        </div>

        {/* VENTAS DEL MES */}
        <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider">
            VENTAS DEL MES
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-[#FFFFFF] font-mono mt-1">
            ${metrics?.monthSales.toFixed(2) || '0.00'}
          </p>
          <p className="text-[10px] text-[#777777] mt-1">
            Mes calendario en curso
          </p>
        </div>

        {/* TOTAL ACUMULADO */}
        <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider">
            TOTAL ACUMULADO
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-[#E0C15A] font-mono mt-1">
            ${metrics?.accumulatedTotal.toFixed(2) || '0.00'}
          </p>
          <p className="text-[10px] text-[#777777] mt-1">
            Histórico registrado en sistema
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° venta, cliente, producto o usuario que registró..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#FAFAFA] placeholder-[#555555] outline-none"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121212] border-b border-[#242424] text-[#8E8E8E] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">N° Venta</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Producto Ganadero</th>
                <th className="py-3.5 px-4">Cantidad</th>
                <th className="py-3.5 px-4">Precio Unit.</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Cliente / Comprador</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4">Registrado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#777777]">
                    Cargando ventas...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#777777]">
                    No se encontraron registros de ventas.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#E0C15A]">
                      {sale.saleNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#888888]">
                      {sale.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#FAFAFA]">
                      {sale.productName}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {sale.quantity} {sale.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#A0A0A0]">
                      ${sale.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#E0C15A]">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-[#D0D0D0]">
                      {sale.customerName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1A1A1A] border border-[#2B2B2B] text-[#CCCCCC]">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#888888]">
                      {sale.registeredBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Sale */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Registrar Nueva Venta Comercial"
        subtitle="Generación de comprobante y cálculo automático"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSale} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Fecha de Despacho *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Forma de Pago
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as Sale['paymentMethod'] })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo de Contado</option>
                <option value="Crédito Ganadero">Crédito Ganadero (30 días)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Producto Ganadero *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price.toFixed(2)} por {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Cantidad *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                  className="flex-1 py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
                <span className="py-2 px-3 bg-[#1A1A1A] border border-[#282828] rounded-lg text-xs text-[#A0A0A0]">
                  {formData.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Precio Unitario ($)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Nombre del Cliente / Empresa Compradora *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Ej. Distribuidora Láctea del Llano, Frigorífico San Juan..."
              required
              className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
            />
          </div>

          {/* Computed Total Preview */}
          <div className="p-3 bg-[#16130B] border border-[#3E351B] rounded-lg flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A0A0A0] uppercase">
              Total Liquidado:
            </span>
            <span className="text-lg font-bold font-mono text-[#E0C15A]">
              ${(formData.quantity * formData.unitPrice).toFixed(2)}
            </span>
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
              className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#C9A227] hover:bg-[#E0C15A] rounded-lg cursor-pointer"
            >
              Confirmar y Registrar Venta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
