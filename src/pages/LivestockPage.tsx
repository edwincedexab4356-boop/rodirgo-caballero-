import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { livestockService, LivestockFilters } from '../services/livestockService';
import { Animal, AnimalSex, AnimalStatus, AnimalType } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Binary,
  Weight,
  Calendar,
  MapPin,
  FileText,
  RotateCcw
} from 'lucide-react';

export const LivestockPage: React.FC = () => {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('Todas');
  const [selectedSex, setSelectedSex] = useState<AnimalSex | 'Todos'>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<AnimalStatus | 'Todos'>('Todos');
  const [selectedLocation, setSelectedLocation] = useState('Todas');

  // Options for dropdowns
  const [availableBreeds, setAvailableBreeds] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [viewDetailAnimal, setViewDetailAnimal] = useState<Animal | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const initialFormState: Omit<Animal, 'id'> = {
    code: '',
    name: '',
    type: 'vaca',
    breed: 'Holstein',
    sex: 'Hembra',
    ageMonths: 12,
    weightKg: 350,
    ingressDate: new Date().toISOString().split('T')[0],
    status: 'Activo',
    location: 'Potrero 1 - Los Samanes',
    observations: '',
    fatherCode: '',
    motherCode: '',
  };
  const [formData, setFormData] = useState<Omit<Animal, 'id'>>(initialFormState);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: LivestockFilters = {
        searchTerm,
        breed: selectedBreed,
        sex: selectedSex,
        status: selectedStatus,
        location: selectedLocation,
      };
      const data = await livestockService.getFiltered(filters);
      setAnimals(data);
      setAvailableBreeds(livestockService.getAvailableBreeds());
      setAvailableLocations(livestockService.getAvailableLocations());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedBreed, selectedSex, selectedStatus, selectedLocation]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBreed('Todas');
    setSelectedSex('Todos');
    setSelectedStatus('Todos');
    setSelectedLocation('Todas');
  };

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    setFormData({
      code: animal.code,
      name: animal.name || '',
      type: animal.type,
      breed: animal.breed,
      sex: animal.sex,
      ageMonths: animal.ageMonths,
      weightKg: animal.weightKg,
      ingressDate: animal.ingressDate,
      status: animal.status,
      location: animal.location,
      observations: animal.observations || '',
      fatherCode: animal.fatherCode || '',
      motherCode: animal.motherCode || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;
    await livestockService.addAnimal(formData, user?.fullName || 'Operador');
    setIsAddModalOpen(false);
    loadData();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    await livestockService.updateAnimal(selectedAnimal.id, formData, user?.fullName || 'Operador');
    setIsEditModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await livestockService.deleteAnimal(deleteConfirmId, user?.fullName || 'Operador');
    setDeleteConfirmId(null);
    loadData();
  };

  const getStatusBadge = (status: AnimalStatus) => {
    switch (status) {
      case 'Activo':
        return 'bg-[#122416] text-[#81C784] border-[#25462A]';
      case 'Gestación':
        return 'bg-[#2B2310] text-[#E0C15A] border-[#4E3E18]';
      case 'En Tratamiento':
        return 'bg-[#331C1C] text-[#FF9E9E] border-[#552727]';
      case 'Cuarentena':
        return 'bg-[#332211] text-[#FFB74D] border-[#573616]';
      case 'Vendido':
        return 'bg-[#1E1E1E] text-[#AAAAAA] border-[#333333]';
      default:
        return 'bg-[#1A1A1A] text-[#888888] border-[#2A2A2A]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Control de Ganado y Fichas Bovinas
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Total en inventario pecuario: <strong className="text-[#E0C15A]">{animals.length}</strong> cabezas registradas
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-[#C9A227]/10 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Ganado</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, código, nombre o raza..."
              className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#FAFAFA] placeholder-[#555555] outline-none"
            />
          </div>

          {/* Raza Filter */}
          <div>
            <select
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              className="w-full py-2 px-3 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#CCCCCC] outline-none"
            >
              <option value="Todas">Todas las razas</option>
              {availableBreeds.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Sexo Filter */}
          <div>
            <select
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value as AnimalSex | 'Todos')}
              className="w-full py-2 px-3 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#CCCCCC] outline-none"
            >
              <option value="Todos">Todos los sexos</option>
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
          </div>

          {/* Estado Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AnimalStatus | 'Todos')}
              className="w-full py-2 px-3 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#CCCCCC] outline-none"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Gestación">Gestación</option>
              <option value="En Tratamiento">En Tratamiento</option>
              <option value="Cuarentena">Cuarentena</option>
              <option value="Vendido">Vendido</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#181818] text-xs">
          <div className="flex items-center gap-2 text-[#888888]">
            <Filter className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Ubicación:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="py-1 px-2.5 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-md text-xs text-[#CCCCCC] outline-none"
            >
              <option value="Todas">Todos los potreros y corrales</option>
              {availableLocations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedBreed !== 'Todas' || selectedSex !== 'Todos' || selectedStatus !== 'Todos' || selectedLocation !== 'Todas') && (
            <button
              onClick={handleResetFilters}
              className="text-[#C9A227] hover:text-[#E0C15A] text-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Professional Livestock Dark Table */}
      <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121212] border-b border-[#242424] text-[#8E8E8E] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Código / Arete</th>
                <th className="py-3.5 px-4">Nombre / Ejemplar</th>
                <th className="py-3.5 px-4">Raza</th>
                <th className="py-3.5 px-4">Sexo</th>
                <th className="py-3.5 px-4">Edad</th>
                <th className="py-3.5 px-4">Peso</th>
                <th className="py-3.5 px-4">Ubicación Actual</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#777777]">
                    Cargando registros pecuarios...
                  </td>
                </tr>
              ) : animals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#777777]">
                    No se encontraron animales con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                animals.map((animal) => (
                  <tr
                    key={animal.id}
                    className="hover:bg-[#141414] transition-colors group text-[#D0D0D0]"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#E0C15A]">
                      {animal.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#FAFAFA]">
                      {animal.name || 'Sin asignar'}
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">
                      {animal.breed}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        animal.sex === 'Macho' ? 'bg-[#141E28] text-[#64B5F6]' : 'bg-[#281420] text-[#F06292]'
                      }`}>
                        {animal.sex}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">
                      {animal.ageMonths} meses
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-[#EAEAEA]">
                      {animal.weightKg} kg
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">
                      {animal.location}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(animal.status)}`}>
                        {animal.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setViewDetailAnimal(animal)}
                        className="p-1.5 rounded-lg text-[#888888] hover:text-[#E0C15A] hover:bg-[#1C1A14] transition-colors"
                        title="Ver detalles completos"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(animal)}
                        className="p-1.5 rounded-lg text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] transition-colors"
                        title="Modificar ficha"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {user?.role === 'ADMINISTRADOR' && (
                        <button
                          onClick={() => setDeleteConfirmId(animal.id)}
                          className="p-1.5 rounded-lg text-[#777777] hover:text-[#FF6B6B] hover:bg-[#281515] transition-colors"
                          title="Dar de baja / Eliminar"
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

      {/* Modal: View Full Animal Detail */}
      {viewDetailAnimal && (
        <Modal
          isOpen={!!viewDetailAnimal}
          onClose={() => setViewDetailAnimal(null)}
          title={`Ficha Ganadera: ${viewDetailAnimal.code}`}
          subtitle={`${viewDetailAnimal.name || 'Ejemplar sin nombre'} • ${viewDetailAnimal.breed}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#141414] rounded-lg border border-[#222222]">
              <div>
                <p className="text-[10px] text-[#777777] uppercase font-semibold">Tipo</p>
                <p className="text-xs font-semibold text-[#EEEEEE]">{viewDetailAnimal.type}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#777777] uppercase font-semibold">Sexo</p>
                <p className="text-xs font-semibold text-[#EEEEEE]">{viewDetailAnimal.sex}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#777777] uppercase font-semibold">Edad</p>
                <p className="text-xs font-semibold text-[#EEEEEE]">{viewDetailAnimal.ageMonths} meses</p>
              </div>
              <div>
                <p className="text-[10px] text-[#777777] uppercase font-semibold">Peso Actual</p>
                <p className="text-xs font-semibold text-[#E0C15A]">{viewDetailAnimal.weightKg} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-[#777777] uppercase font-semibold">Estado</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(viewDetailAnimal.status)}`}>
                  {viewDetailAnimal.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#777777] uppercase font-semibold">Fecha Ingreso</p>
                <p className="text-xs text-[#EEEEEE]">{viewDetailAnimal.ingressDate}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-[#777777] uppercase font-semibold mb-1">Ubicación en Hacienda</p>
              <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222222] flex items-center gap-2 text-xs text-[#DDDDDD]">
                <MapPin className="w-4 h-4 text-[#C9A227]" />
                <span>{viewDetailAnimal.location}</span>
              </div>
            </div>

            {(viewDetailAnimal.fatherCode || viewDetailAnimal.motherCode) && (
              <div>
                <p className="text-[10px] text-[#777777] uppercase font-semibold mb-1">Genealogía / Progenie</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#141414] border border-[#222222] rounded">
                    <span className="text-[#777777]">Padre:</span> {viewDetailAnimal.fatherCode || 'No registrado'}
                  </div>
                  <div className="p-2 bg-[#141414] border border-[#222222] rounded">
                    <span className="text-[#777777]">Madre:</span> {viewDetailAnimal.motherCode || 'No registrada'}
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] text-[#777777] uppercase font-semibold mb-1">Observaciones Técnicas y Sanitarias</p>
              <div className="p-3 bg-[#141414] border border-[#222222] rounded-lg text-xs text-[#A0A0A0] leading-relaxed">
                {viewDetailAnimal.observations || 'Sin observaciones adicionales registradas.'}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Add or Edit Animal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Registrar Nuevo Ejemplar' : 'Modificar Ficha de Ganado'}
        subtitle="Información técnica preparada para sincronización con Firestore"
        maxWidth="xl"
      >
        <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Número o Código de Arete *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ej. SB-110"
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Nombre o Alias (Opcional)
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Centauro"
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Tipo de Especie
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AnimalType })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="vaca">Vaca</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Raza
              </label>
              <input
                type="text"
                list="breed-options"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="Ej. Red Sindi, Holstein, Jersey..."
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
              <datalist id="breed-options">
                <option value="Red Sindi" />
                <option value="Holstein" />
                <option value="Pardo Suizo" />
                <option value="Ayrshire" />
                <option value="Guernsey" />
                <option value="Simmental" />
                <option value="Canadienne" />
                <option value="Shorthorn" />
                <option value="Montbéliarde" />
                <option value="Guzerá" />
                <option value="Jersey" />
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Sexo
              </label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value as AnimalSex })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Edad (Meses)
              </label>
              <input
                type="number"
                min="1"
                value={formData.ageMonths}
                onChange={(e) => setFormData({ ...formData, ageMonths: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Peso Actual (kg)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Estado Operativo
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AnimalStatus })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Activo">Activo</option>
                <option value="Gestación">Gestación</option>
                <option value="En Tratamiento">En Tratamiento</option>
                <option value="Cuarentena">Cuarentena</option>
                <option value="Vendido">Vendido</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Ubicación (Potrero / Corral)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej. Potrero 2 - El Manantial"
                required
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={formData.ingressDate}
                onChange={(e) => setFormData({ ...formData, ingressDate: e.target.value })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Observaciones Clínicas o de Manejo
            </label>
            <textarea
              rows={3}
              value={formData.observations || ''}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Detalles sobre vacunas, alimentación, comportamiento..."
              className="w-full p-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-[#8E8E8E] hover:text-[#FFFFFF] bg-[#141414] rounded-lg border border-[#242424]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#C9A227] hover:bg-[#E0C15A] rounded-lg cursor-pointer"
            >
              {isAddModalOpen ? 'Guardar Ganado' : 'Actualizar Ficha'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Dar de Baja Animal"
        message="¿Está seguro de que desea eliminar la ficha de este ejemplar? Esta acción se registrará en la auditoría del sistema."
        confirmText="Confirmar Baja"
      />
    </div>
  );
};
