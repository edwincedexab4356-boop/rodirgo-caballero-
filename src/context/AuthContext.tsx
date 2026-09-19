import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, LoginCredentials } from '../services/authService';
import { activityService } from '../services/activityService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (module: string) => boolean;
  activeRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'agro_session_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar sesión (si existía un identificador previo de sesión)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUid = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (savedUid) {
          const users = await authService.getUsers();
          const found = users.find((u) => u.id === savedUid && u.active);
          if (found) {
            setUser(found);
          } else {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Error restaurando sesión:', err);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user: authenticatedUser } = await authService.login(credentials);
      setUser(authenticatedUser);
      sessionStorage.setItem(AUTH_STORAGE_KEY, authenticatedUser.id);
      
      activityService.log({
        userId: authenticatedUser.id,
        userName: authenticatedUser.fullName,
        role: authenticatedUser.role,
        action: 'Inicio de Sesión Exitoso',
        module: 'Seguridad',
        details: `Rol verificado: ${authenticatedUser.role}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (user) {
      activityService.log({
        userId: user.id,
        userName: user.fullName,
        role: user.role,
        action: 'Cierre de Sesión',
        module: 'Seguridad',
      });
    }
    await authService.logout();
    setUser(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const canAccess = (module: string): boolean => {
    if (!user) return false;
    return authService.canAccessModule(user.role, module);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        canAccess,
        activeRole: user ? user.role : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
