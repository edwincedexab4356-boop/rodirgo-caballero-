import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BullEmblem } from '../BullEmblem';
import {
  LayoutDashboard,
  Milk,
  Binary,
  Boxes,
  ShoppingBag,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Activity,
  Users,
  Settings,
  LogOut,
  CalendarCheck2,
  X
} from 'lucide-react';

export type NavigationTab =
  | 'inicio'
  | 'lecheria'
  | 'ganado'
  | 'inventario'
  | 'productos'
  | 'produccion'
  | 'ventas'
  | 'cierre-diario'
  | 'reportes'
  | 'actividad'
  | 'usuarios'
  | 'configuracion';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogoutClick: () => void;
}

interface NavItemDef {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'inicio', label: 'INICIO', icon: LayoutDashboard },
  { id: 'lecheria', label: 'LECHERÍA', icon: Milk },
  { id: 'ganado', label: 'GANADO', icon: Binary },
  { id: 'inventario', label: 'INVENTARIO', icon: Boxes },
  { id: 'productos', label: 'PRODUCTOS', icon: ShoppingBag },
  { id: 'produccion', label: 'PRODUCCIÓN', icon: TrendingUp },
  { id: 'ventas', label: 'VENTAS', icon: Receipt },
  { id: 'cierre-diario', label: 'CIERRE DIARIO', icon: CalendarCheck2 },
  { id: 'reportes', label: 'REPORTES', icon: FileSpreadsheet },
  { id: 'actividad', label: 'ACTIVIDAD', icon: Activity },
  { id: 'usuarios', label: 'USUARIOS', icon: Users, adminOnly: true },
  { id: 'configuracion', label: 'CONFIGURACIÓN', icon: Settings, adminOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onLogoutClick,
}) => {
  const { user, canAccess } = useAuth();

  // Filtrar según permisos de rol: el usuario regular NO verá USUARIOS ni CONFIGURACIÓN
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) {
      return user?.role === 'ADMINISTRADOR';
    }
    return canAccess(item.id);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#070707] border-r border-[#1C1A14] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1A1812] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BullEmblem size={38} glow />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-wider text-[#FFFFFF] font-serif-luxury">
                  AGROGESTIÓN
                </span>
              </div>
              <p className="text-[10px] tracking-widest text-[#C9A227] font-semibold uppercase">
                Sistema Ganadero
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-[#888888] hover:text-[#C9A227]"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ranch Tag Subheader */}
        <div className="px-5 py-3 bg-[#0A0A0A] border-b border-[#161616] flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[11px] font-semibold text-[#D0D0D0] truncate">
              Hda. San Gabriel
            </p>
            <p className="text-[10px] text-[#707070] truncate">
              Reg. ICA 2024-8849
            </p>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium tracking-wider bg-[#14120B] text-[#E0C15A] border border-[#2F2916]">
            PRIVADO
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-150 relative ${
                  isActive
                    ? 'bg-[#15130C] text-[#E0C15A] border border-[#C9A227]/40 shadow-sm shadow-[#C9A227]/10'
                    : 'text-[#909090] hover:text-[#E0E0E0] hover:bg-[#111111] border border-transparent'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#C9A227]" />
                )}
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#C9A227]' : 'text-[#6A6A6A]'
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.adminOnly && (
                  <span className="text-[9px] uppercase tracking-wider text-[#C9A227]/70 font-mono">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer with Role & Logout */}
        <div className="p-3 border-t border-[#1A1812] bg-[#060606] space-y-2">
          <div className="px-3 py-2 rounded-lg bg-[#0C0C0C] border border-[#1C1C1C]">
            <p className="text-[10px] text-[#707070] uppercase tracking-wider font-semibold">
              Operador en sesión
            </p>
            <p className="text-xs font-semibold text-[#EAEAEA] truncate">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-[#C9A227] font-medium tracking-wide">
              {user?.role === 'ADMINISTRADOR' ? 'Acceso Total (Admin)' : 'Acceso Operativo'}
            </p>
          </div>

          <button
            onClick={onLogoutClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#A0A0A0] hover:text-[#E0C15A] bg-[#0E0E0E] hover:bg-[#16130B] rounded-lg border border-[#222222] hover:border-[#C9A227]/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>CERRAR SESIÓN</span>
          </button>
        </div>
      </aside>
    </>
  );
};
