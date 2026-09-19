import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsService } from '../services/productsService';
import { Product } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  Tag,
  PackageCheck
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const initialForm = {
    name: '',
    category: 'Lácteos',
    price: 10.0,
    cost: 5.0,
    quantity: 100,
    unit: 'Litros',
    status: 'Disponible' as Product['status'],
    description: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productsService.getAll();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      cost: prod.cost,
      quantity: prod.quantity,
      unit: prod.unit,
      status: prod.status,
      description: prod.description,
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isAddOpen) {
      await productsService.addProduct(formData, user?.fullName || 'Operador');
      setIsAddOpen(false);
    } else if (selectedProduct) {
      await productsService.updateProduct(selectedProduct.id, formData, user?.fullName || 'Operador');
      setIsEditOpen(false);
    }
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await productsService.deleteProduct(deleteConfirmId, user?.fullName || 'Operador');
    setDeleteConfirmId(null);
    loadData();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Catálogo de Productos y Oferta Comercial
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Gestión de productos ganaderos para venta: lácteos, ganado en pie, genética y derivados
          </p>
        </div>

        {user?.role === 'ADMINISTRADOR' && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md shadow-[#C9A227]/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o descripción del producto..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#FAFAFA] placeholder-[#555555] outline-none"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#CCCCCC] outline-none"
          >
            <option value="Todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((prod) => {
          const margin = prod.price > 0 ? (((prod.price - prod.cost) / prod.price) * 100).toFixed(0) : 0;
          return (
            <div
              key={prod.id}
              className="bg-[#0D0D0D] border border-[#222222] hover:border-[#C9A227]/40 rounded-xl p-5 flex flex-col justify-between transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#17140B] text-[#E0C15A] border border-[#3A3218]">
                    {prod.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#777777]">
                    Ref: {prod.createdAt}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#FFFFFF] tracking-tight mb-1">
                  {prod.name}
                </h3>
                <p className="text-xs text-[#8E8E8E] line-clamp-2 mb-4 leading-relaxed">
                  {prod.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#1C1C1C]">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-lg bg-[#141414]">
                  <div>
                    <p className="text-[10px] text-[#777777] uppercase font-semibold">Precio Venta</p>
                    <p className="text-xs font-bold text-[#E0C15A]">${prod.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#777777] uppercase font-semibold">Costo Est.</p>
                    <p className="text-xs font-medium text-[#A0A0A0]">${prod.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#777777] uppercase font-semibold">Margen</p>
                    <p className="text-xs font-bold text-[#81C784]">+{margin}%</p>
                  </div>
                </div>

                {/* Stock & Actions Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#CCCCCC]">
                    <PackageCheck className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span className="font-mono font-bold text-[#FFFFFF]">{prod.quantity}</span>
                    <span className="text-[#888888]">{prod.unit}</span>
                  </div>

                  {user?.role === 'ADMINISTRADOR' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-lg transition-colors"
                        title="Modificar producto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(prod.id)}
                        className="p-1.5 text-[#777777] hover:text-[#FF6B6B] hover:bg-[#2A1414] rounded-lg transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add or Edit Product */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isAddOpen ? 'Crear Nuevo Producto Comercial' : 'Editar Producto'}
        subtitle="Administración del catálogo de venta ganadera"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Nombre Comercial *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Queso Campesino, Leche Grado A..."
              required
              className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej. Lácteos, Ganado en Pie, Genética..."
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Unidad de Venta
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Ej. Litros, Kilos, Cabezas, Pajillas..."
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Precio de Venta ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.05"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Costo de Producción ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.05"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Cantidad en Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Product['status'] })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Disponible">Disponible</option>
                <option value="Bajo Stock">Bajo Stock</option>
                <option value="Agotado">Agotado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Descripción y Ficha Técnica
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles sobre calidad, almacenamiento, peso promedio..."
              className="w-full p-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-[#8E8E8E] hover:text-[#FFFFFF] bg-[#141414] rounded-lg border border-[#242424]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#C9A227] hover:bg-[#E0C15A] rounded-lg cursor-pointer"
            >
              {isAddOpen ? 'Guardar Producto' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message="¿Está seguro de que desea eliminar este producto del catálogo comercial? No se eliminarán las ventas históricas asociadas."
        confirmText="Eliminar"
      />
    </div>
  );
};
