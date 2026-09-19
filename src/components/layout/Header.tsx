import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield, User as UserIcon, Menu, Database } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { subscribeToFirestoreStatus, FirestoreConnectionStatus } from '../../services/firestoreHelper';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  activeModuleTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  activeModuleTitle,
}) => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<FirestoreConnectionStatus>('connected');
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeToFirestoreStatus((status, message) => {
      setFirestoreStatus(status);
      if (message) setStatusMessage(message);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-[#0B0B0B] border-b border-[#222222] px-4 lg:px-8 flex items-center justify-between">
        {/* Left Side: Mobile Hamburger & Current Module Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-[#C9A227] hover:bg-[#151515] border border-[#2B271A]"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
            <h1 className="text-sm sm:text-base font-bold tracking-wide text-[#EEEEEE]">
              {activeModuleTitle}
            </h1>
          </div>
        </div>

        {/* Right Side: Firebase Status, User Details, Role Pill & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Firestore Connection Badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141414] border border-[#262626] text-[10px] text-[#A0A0A0]"
            title={statusMessage || 'Conexión con Firebase Firestore'}
          >
            <Database className="w-3 h-3 text-[#C9A227]" />
            <span className="font-mono">Firestore</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                firestoreStatus === 'connected'
                  ? 'bg-[#81C784]'
                  : firestoreStatus === 'rules-blocked'
                  ? 'bg-[#E57373]'
                  : 'bg-[#FFB74D]'
              }`}
            />
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 text-right">
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-[#F0F0F0] leading-none">
                {user?.fullName}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="inline-block w-1 h-1 rounded-full bg-[#C9A227]" />
                <span className="text-[10px] tracking-wider font-semibold text-[#C9A227] uppercase">
                  {user?.role === 'ADMINISTRADOR' ? 'Administrador' : 'Operador'}
                </span>
              </div>
            </div>

            {/* Role Badge */}
            <div
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border flex items-center gap-1 ${
                user?.role === 'ADMINISTRADOR'
                  ? 'bg-[#18150D] text-[#C9A227] border-[#3A3215]'
                  : 'bg-[#141414] text-[#A0A0A0] border-[#2A2A2A]'
              }`}
            >
              {user?.role === 'ADMINISTRADOR' ? (
                <Shield className="w-3 h-3 text-[#C9A227]" />
              ) : (
                <UserIcon className="w-3 h-3 text-[#888888]" />
              )}
              <span>{user?.role === 'ADMINISTRADOR' ? 'Admin' : 'Operador'}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-[1px] bg-[#222222]" />

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B0B0B0] hover:text-[#FFFFFF] bg-[#141414] hover:bg-[#1E1E1E] rounded-lg border border-[#262626] transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5 text-[#C9A227]" />
            <span className="hidden sm:inline text-[11px]">Salir</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Confirmar Cierre de Sesión"
        message="¿Está seguro de que desea salir del sistema de gestión ganadera? Deberá ingresar sus credenciales nuevamente para acceder."
        confirmText="Cerrar Sesión"
        isDestructive={false}
      />
    </>
  );
};
