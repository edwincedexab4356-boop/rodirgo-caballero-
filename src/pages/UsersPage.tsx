import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  Edit2,
  Trash2,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const initialForm = {
    fullName: '',
    email: '',
    role: 'USUARIO REGULAR' as UserRole,
    status: 'Activo' as User['status'],
    password: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '',
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (isAddOpen) {
        if (!formData.password || formData.password.length < 6) {
          setFormError('La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        await authService.createUser(formData, currentUser?.fullName || 'Administrador');
        setIsAddOpen(false);
      } else if (selectedUser) {
        await authService.updateUser(
          selectedUser.id,
          {
            fullName: formData.fullName,
            email: formData.email,
            role: formData.role,
            status: formData.status,
          },
          currentUser?.fullName || 'Administrador'
        );
        setIsEditOpen(false);
      }
      loadUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Error al procesar usuario.');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await authService.deleteUser(deleteConfirmId, currentUser?.fullName || 'Administrador');
      setDeleteConfirmId(null);
      loadUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Control de Usuarios y Permisos de Acceso
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Gestión de roles (Administrador vs. Usuario Regular) y credenciales del personal de la hacienda
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md shadow-[#C9A227]/10 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Usuario</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0D0D0D] border border-[#3E351B] p-4 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#E0C15A] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#E0C15A] uppercase tracking-wider">
              Rol: ADMINISTRADOR
            </h4>
            <p className="text-xs text-[#8E8E8E] mt-1 leading-relaxed">
              Acceso absoluto a la plataforma: control total de ganado, creación y edición de usuarios, visualización de ventas e indicadores financieros, cierre de jornada y configuración.
            </p>
          </div>
        </div>

        <div className="bg-[#0D0D0D] border border-[#222222] p-4 rounded-xl flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#666666] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#CCCCCC] uppercase tracking-wider">
              Rol: USUARIO REGULAR
            </h4>
            <p className="text-xs text-[#8E8E8E] mt-1 leading-relaxed">
              Permiso para consultar inventario, fichas pecuarias y registrar producción u ordeño. No tiene acceso a reportes financieros, cierre del día ni gestión de usuarios.
            </p>
          </div>
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
            placeholder="Buscar usuario por nombre o correo electrónico..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#262626] focus:border-[#C9A227] rounded-lg text-xs text-[#FAFAFA] placeholder-[#555555] outline-none"
          />
        </div>
      </div>

      {/* Users Table (MANDATED BY SPEC 16) */}
      <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121212] border-b border-[#242424] text-[#8E8E8E] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Nombre Completo</th>
                <th className="py-3.5 px-4">Correo Electrónico</th>
                <th className="py-3.5 px-4">Rol Asignado</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Último Acceso</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#777777]">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#777777]">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#141414] text-[#CCCCCC]">
                    <td className="py-3.5 px-4 font-semibold text-[#FAFAFA]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center font-bold text-xs text-[#E0C15A]">
                          {u.fullName.charAt(0)}
                        </div>
                        <span>{u.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#A0A0A0]">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        u.role === 'ADMINISTRADOR'
                          ? 'bg-[#2B2310] text-[#E0C15A] border-[#4E3E18]'
                          : 'bg-[#181818] text-[#AAAAAA] border-[#2A2A2A]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 border ${
                        u.status === 'Activo'
                          ? 'bg-[#122416] text-[#81C784] border-[#25462A]'
                          : 'bg-[#2A1818] text-[#FF8A80] border-[#4A2525]'
                      }`}>
                        {u.status === 'Activo' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#888888]">
                      {u.lastLogin || 'Sin registrar'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-[#888888] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] rounded-lg transition-colors"
                        title="Modificar usuario"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUser?.id &&
                        !u.username.toLowerCase().includes('rodrigo') &&
                        !u.fullName.toLowerCase().includes('rodrigo') && (
                        <button
                          onClick={() => setDeleteConfirmId(u.id)}
                          className="p-1.5 text-[#777777] hover:text-[#FF6B6B] hover:bg-[#2A1414] rounded-lg transition-colors"
                          title="Eliminar usuario"
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

      {/* Modal: Add or Edit User */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isAddOpen ? 'Crear Nuevo Usuario del Sistema' : 'Modificar Usuario'}
        subtitle="Control de credenciales y nivel de acceso operacional"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-[#2B1414] border border-[#4A2020] text-xs text-[#FF8585]">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Nombre Completo *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ej. Dr. Mauricio Albarracín"
                required
                className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
              Correo Electrónico (Acceso) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
                className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              />
            </div>
          </div>

          {isAddOpen && (
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Contraseña Temporal (Mín. 6 caracteres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Rol del Usuario
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                <option value="USUARIO REGULAR">USUARIO REGULAR</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                Estado de la Cuenta
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
                className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
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
              {isAddOpen ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete User */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Revocar Acceso y Eliminar Usuario"
        message="¿Está seguro de que desea eliminar a este usuario del sistema ganadero? Esta acción se registrará en la auditoría general."
        confirmText="Eliminar Usuario"
      />
    </div>
  );
};
