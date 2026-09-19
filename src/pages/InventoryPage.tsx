import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryService } from '../services/inventoryService';
import { InventoryItem, InventoryMovement, InventoryCategory, InventoryStatus, MovementType } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Boxes,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  History,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'existencias' | 'movimientos'>('existencias');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [itemFormData, setItemFormData] = useState({
    name: '',
    category: 'Alimentos' as InventoryCategory,
    quantity: 10,
    unit: 'Sacos',
    minStock: 5,
    costPerUnit: 15.00,
    location: 'Bodega Principal',
  });

  const [movementData, setMovementData] = useState({
    itemId: '',
    type: 'Salida' as MovementType,
    quantity: 1,
    reason: '',
  });
  const [movementError, setMovementError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allInventory, allMovements] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getMovements(),
      ]);
      setItems(allInventory);
      setMovements(allMovements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddItem = () => {
    setItemFormData({
      name: '',
      category: 'Alimentos',
      quantity: 10,
      unit: 'Sacos',
      minStock: 5,
      costPerUnit: 15.00,
      location: 'Bodega Principal',
    });
    setIsAddItemOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setItemFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit,
      location: item.location,
    });
    setIsEditItemOpen(true);
  };

  const handleOpenMovement = (item?: InventoryItem) => {
    if (item) {
      setMovementData({
        itemId: item.id,
        type: 'Salida',
        quantity: 1,
        reason: '',
      });
    } else if (items.length > 0) {
      setMovementData({
        itemId: items[0].id,
        type: 'Salida',
        quantity: 1,
        reason: '',
      });
    }
    setMovementError(null);
    setIsMovementModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim()) return;

    if (isAddItemOpen) {
      await inventoryService.addItem(itemFormData, user?.fullName || 'Operador');
      setIsAddItemOpen(false);
    } else if (selectedItem) {
      await inventoryService.updateItem(selectedItem.id, itemFormData, user?.fullName || 'Operador');
      setIsEditItemOpen(false);
    }
    loadData();
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError(null);
    try {
      await inventoryService.registerMovement(
        movementData.itemId,
        movementData.type,
        movementData.quantity,
        movementData.reason || 'Sin motivo especificado',
        user?.fullName || 'Operador'
      );
      setIsMovementModalOpen(false);
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMovementError(err.message);
      } else {
        setMovementError('Error registrando el movimiento de almacén.');
      }
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmId) return;
    await inventoryService.deleteItem(deleteConfirmId, user?.fullName || 'Operador');
    setDeleteConfirmId(null);
    loadData();
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: InventoryStatus) => {
    switch (status) {
      case 'Disponible':
        return 'bg-[#122416] text-[#81C784] border-[#25462A]';
      case 'Bajo':
        return 'bg-[#2B2310] text-[#E0C15A] border-[#4E3E18]';
      case 'Agotado':
        return 'bg-[#331C1C] text-[#FF9E9E] border-[#552727]';
      default:
        return 'bg-[#1A1A1A] text-[#888888]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Control de Inventario y Almacén Ganadero
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Gestión de alimentos, medicamentos veterinarios, herramientas e insumos del campo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenMovement()}
            className="px-3.5 py-2 rounded-lg bg-[#181611] hover:bg-[#221F14] text-[#E0C15A] border border-[#3E351B] font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-[#C9A227]" />
            <span>Registrar Movimiento</span>
          </button>

          <button
            onClick={handleOpenAddItem}
            className="px-4 py-2 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md shadow-[#C9A227]/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Inventario</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector: Existencias vs Movimientos */}
      <div className="flex items-center gap-2 border-b border-[#202020] pb-2">
        <button
          onClick={() => setActiveTab('existencias')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'existencias'
              ? 'bg-[#181610] text-[#E0C15A] border border-[#C9A227]/40'
              : 'text-[#888888] hover:text-[#DDDDDD]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>EXISTENCIAS ACTUALES ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movimientos')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'movimientos'
              ? 'bg-[#181610] text-[#E0C15A] border border-[#C9A227]/40'
              : 'text-[#888888] hover:text-[#DDDDDD]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>HISTORIAL DE MOVIMIENTOS ({movements.length})</span>
        </button>
      </div>

      {activeTab === 'existencias' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar insumo o ubicación..."
                  className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#FAFAFA] placeholder-[#555555] outline-none"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#CCCCCC] outline-none"
                >
                  <option value="Todas">Todas las categorías</option>
                  <option value="Alimentos">Alimentos</option>
                  <option value="Medicamentos">Medicamentos</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Insumos">Insumos</option>
                  <option value="Equipos">Equipos</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#CCCCCC] outline-none"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Disponible">Disponible</option>
                  <option value="Bajo">Stock Bajo</option>
                  <option value="Agotado">Agotado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#121212] border-b border-[#242424] text-[#8E8E8E] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Producto / Insumo</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Cantidad Actual</th>
                    <th className="py-3.5 px-4">Stock Mínimo</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Ubicación</th>
                    <th className="py-3.5 px-4">Costo Ref.</th>
                    <th className="py-3.5 px-4">Última Act.</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#777777]">
                        Cargando inventario...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#777777]">
                        No se encontraron ítems con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#141414] transition-colors text-[#D0D0D0]"
                      >
                        <td className="py-3.5 px-4 font-semibold text-[#FAFAFA]">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4 text-[#A0A0A0]">
                          {item.category}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#E0C15A]">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-[#888888] font-mono">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#A0A0A0]">
                          {item.location}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#CCCCCC]">
                          ${item.costPerUnit.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-[#777777]">
                          {item.lastUpdated}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenMovement(item)}
                            className="p-1.5 rounded-lg text-[#C9A227] hover:bg-[#1C1A14]"
                            title="Registrar entrada o salida directa"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1E1E1E]"
                            title="Editar ítem"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {user?.role === 'ADMINISTRADOR' && (
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 rounded-lg text-[#777777] hover:text-[#FF6B6B] hover:bg-[#281515]"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Kardex / Movements History View */
        <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#202020] bg-[#121212] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#EAEAEA] uppercase tracking-wider">
              Libro Diario de Movimientos de Almacén
            </h3>
            <span className="text-[11px] text-[#888888]">
              Registros ordenados cronológicamente
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] border-b border-[#222222] text-[#888888] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Producto / Insumo</th>
                  <th className="py-3.5 px-4">Cantidad</th>
                  <th className="py-3.5 px-4">Motivo / Justificación</th>
                  <th className="py-3.5 px-4">Operador Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3 px-4 font-mono text-[#888888]">{mov.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 border ${
                        mov.type === 'Entrada'
                          ? 'bg-[#122416] text-[#81C784] border-[#25462A]'
                          : 'bg-[#2A1818] text-[#FF8A80] border-[#4A2525]'
                      }`}>
                        {mov.type === 'Entrada' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {mov.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#EEEEEE]">{mov.itemName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E0C15A]">
                      {mov.type === 'Entrada' ? '+' : '-'}{mov.quantity} {mov.unit}
                    </td>
                    <td className="py-3 px-4 text-[#A0A0A0]">{mov.reason}</td>
                    <td className="py-3 px-4 text-[#888888]">{mov.registeredBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Inventory Item */}
      <Modal
        isOpen={isAddItemOpen || isEditItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setIsEditItemOpen(false);
        }}
        title={isAddItemOpen ? 'Nuevo Ítem en Almacén' : 'Editar Ítem de Inventario'}
        subtitle="Control de existencias y costos unitarios"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Nombre del Insumo / Producto *
            </label>
            <input
              type="text"
              value={itemFormData.name}
              onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              placeholder="Ej. Sal mineralizada 8%, Vacuna aftosa..."
              required
              className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Categoría
              </label>
              <select
                value={itemFormData.category}
                onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value as InventoryCategory })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Alimentos">Alimentos</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Herramientas">Herramientas</option>
                <option value="Insumos">Insumos</option>
                <option value="Equipos">Equipos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Unidad de Medida
              </label>
              <input
                type="text"
                value={itemFormData.unit}
                onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                placeholder="Ej. Sacos 40kg, Frascos, Litros..."
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Cantidad Inicial
              </label>
              <input
                type="number"
                min="0"
                value={itemFormData.quantity}
                onChange={(e) => setItemFormData({ ...itemFormData, quantity: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="1"
                value={itemFormData.minStock}
                onChange={(e) => setItemFormData({ ...itemFormData, minStock: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Costo Unitario Ref. ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={itemFormData.costPerUnit}
                onChange={(e) => setItemFormData({ ...itemFormData, costPerUnit: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Ubicación en Bodega
              </label>
              <input
                type="text"
                value={itemFormData.location}
                onChange={(e) => setItemFormData({ ...itemFormData, location: e.target.value })}
                placeholder="Ej. Estante A, Cuarto Frío..."
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => {
                setIsAddItemOpen(false);
                setIsEditItemOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-[#8E8E8E] hover:text-[#FFFFFF] bg-[#141414] rounded-lg border border-[#242424]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#C9A227] hover:bg-[#E0C15A] rounded-lg cursor-pointer"
            >
              {isAddItemOpen ? 'Guardar Ítem' : 'Actualizar Ítem'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Register Movement (Entrada / Salida) */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Registrar Movimiento de Almacén"
        subtitle="Ajuste inmediato de existencias con trazabilidad"
        maxWidth="md"
      >
        <form onSubmit={handleSaveMovement} className="space-y-4">
          {movementError && (
            <div className="p-3 rounded-lg bg-[#2B1414] border border-[#4A2020] text-xs text-[#FF8585]">
              {movementError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Producto o Insumo *
            </label>
            <select
              value={movementData.itemId}
              onChange={(e) => setMovementData({ ...movementData, itemId: e.target.value })}
              className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stock: {i.quantity} {i.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Tipo de Movimiento
              </label>
              <select
                value={movementData.type}
                onChange={(e) => setMovementData({ ...movementData, type: e.target.value as MovementType })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Salida">Salida (Consumo / Despacho)</option>
                <option value="Entrada">Entrada (Compra / Recepción)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Cantidad a Mover *
              </label>
              <input
                type="number"
                min="1"
                value={movementData.quantity}
                onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Motivo o Justificación del Movimiento *
            </label>
            <input
              type="text"
              value={movementData.reason}
              onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
              placeholder="Ej. Alimentación lote de ordeño, Compra proveedor..."
              required
              className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => setIsMovementModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#8E8E8E] hover:text-[#FFFFFF] bg-[#141414] rounded-lg border border-[#242424]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#C9A227] hover:bg-[#E0C15A] rounded-lg cursor-pointer"
            >
              Registrar Movimiento
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteItem}
        title="Eliminar Ítem del Inventario"
        message="¿Está seguro de que desea eliminar este ítem del almacén? Se perderá el registro de existencias actual."
        confirmText="Eliminar Ítem"
      />
    </div>
  );
};
