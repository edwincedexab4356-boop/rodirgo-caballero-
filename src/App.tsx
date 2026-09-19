import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ConfirmDialog } from './components/ui/ConfirmDialog';

// Module Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LivestockPage } from './pages/LivestockPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductionPage } from './pages/ProductionPage';
import { SalesPage } from './pages/SalesPage';
import { DailyClosePage } from './pages/DailyClosePage';
import { DairyPage } from './pages/DairyPage';
import { ReportsPage } from './pages/ReportsPage';
import { ActivityPage } from './pages/ActivityPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

const TAB_TITLES: Record<NavigationTab, string> = {
  inicio: 'PANEL PRINCIPAL DE GESTIÓN',
  lecheria: 'CONTROL LECHERO Y PRODUCCIÓN INDIVIDUAL',
  ganado: 'CONTROL GANADERO Y CENSO PECUARIO',
  inventario: 'CONTROL DE INVENTARIO Y ALMACÉN',
  productos: 'CATÁLOGO DE PRODUCTOS COMERCIALES',
  produccion: 'REGISTRO DIARIO DE PRODUCCIÓN',
  ventas: 'FACTURACIÓN Y CONTROL DE VENTAS',
  'cierre-diario': 'RESUMEN DEL DÍA — CIERRE OPERACIONAL',
  reportes: 'INFORMES Y RESÚMENES EJECUTIVOS',
  actividad: 'BITÁCORA DE AUDITORÍA Y ACTIVIDAD',
  usuarios: 'ADMINISTRACIÓN DE USUARIOS Y PERMISOS',
  configuracion: 'CONFIGURACIÓN DE LA OPERACIÓN GANADERA',
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, canAccess, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Role-based access validation fallback
  const hasAccess = canAccess(activeTab);
  const currentTab = hasAccess ? activeTab : 'inicio';

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'inicio':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'lecheria':
        return <DairyPage />;
      case 'ganado':
        return <LivestockPage />;
      case 'inventario':
        return <InventoryPage />;
      case 'productos':
        return <ProductsPage />;
      case 'produccion':
        return <ProductionPage />;
      case 'ventas':
        return <SalesPage />;
      case 'cierre-diario':
        return <DailyClosePage />;
      case 'reportes':
        return <ReportsPage />;
      case 'actividad':
        return <ActivityPage />;
      case 'usuarios':
        return <UsersPage />;
      case 'configuracion':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={currentTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          activeModuleTitle={TAB_TITLES[currentTab]}
        />

        {/* Page View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Confirmar Cierre de Sesión"
        message="¿Está seguro de que desea cerrar su sesión actual en AGROGESTIÓN? Su actividad ha sido registrada en la auditoría inmutable."
        confirmText="Cerrar Sesión"
        isDestructive={false}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
