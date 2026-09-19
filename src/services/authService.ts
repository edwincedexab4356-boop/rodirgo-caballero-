/**
 * SERVICIO DE AUTENTICACIÓN Y GESTIÓN DE USUARIOS - CONECTADO CON FIRESTORE
 * Colección: 'users'
 */

import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { tryFirestoreGet, tryFirestoreSet, tryFirestoreDelete } from './firestoreHelper';

const COLLECTION_NAME = 'users';
const LOCAL_STORAGE_KEY = 'agrogestion_users_data';

let systemUsers: User[] = [];
let isLoaded = false;

function sanitizeAndSyncUsers(existing: User[]): User[] {
  // Filtrar usuarios eliminados (Digna o usuarios antiguos de prueba)
  let list = existing.filter(
    (u) =>
      u.id !== 'usr-admin-digna' &&
      !u.username.toLowerCase().includes('digna') &&
      !u.fullName.toLowerCase().includes('digna') &&
      !u.email.toLowerCase().includes('digna')
  );

  // Asegurar Administrador Rodrigo Caballero
  let rodrigo = list.find(
    (u) =>
      u.id === 'usr-admin-rodrigo' ||
      u.username.toLowerCase().includes('rodrigo') ||
      u.fullName.toLowerCase().includes('rodrigo')
  );

  if (!rodrigo) {
    rodrigo = { ...INITIAL_USERS[0] };
    list.unshift(rodrigo);
  } else {
    rodrigo.username = 'rodrigo caballero';
    rodrigo.fullName = 'Rodrigo Caballero';
    rodrigo.email = 'rodrigo@haciendacaballero.com';
    rodrigo.role = 'ADMINISTRADOR';
    rodrigo.active = true;
    rodrigo.status = 'Activo';
    rodrigo.password = '123456';
    rodrigo.title = 'Propietario / Administrador General';
  }

  // Asegurar Operadora Sra. Migdalia Caballero
  let migdalia = list.find(
    (u) =>
      u.id === 'usr-operador-migdalia' ||
      u.username.toLowerCase().includes('migdalia') ||
      u.fullName.toLowerCase().includes('migdalia')
  );

  if (!migdalia) {
    migdalia = { ...INITIAL_USERS[1] };
    list.push(migdalia);
  } else {
    migdalia.fullName = 'Sra. Migdalia Caballero';
    migdalia.username = 'migdalia';
    migdalia.email = 'migdalia@haciendacaballero.com';
    migdalia.role = 'USUARIO_REGULAR';
    migdalia.active = true;
    migdalia.status = 'Activo';
    migdalia.password = '123456';
    migdalia.title = 'Operadora de Campo';
  }

  // Mantener solo a Rodrigo y Migdalia según la solicitud directa del usuario
  list = [rodrigo, migdalia];

  return list;
}

function loadFromStorage(): User[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed: User[] = saved ? JSON.parse(saved) : [...INITIAL_USERS];
    const cleaned = sanitizeAndSyncUsers(parsed);
    saveToStorage(cleaned);
    return cleaned;
  } catch {
    const defaultList = [...INITIAL_USERS];
    saveToStorage(defaultList);
    return defaultList;
  }
}

function saveToStorage(users: User[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to localStorage:', err);
  }
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

export const authService = {
  async ensureLoaded() {
    if (!isLoaded) {
      systemUsers = loadFromStorage();
      const res = await tryFirestoreGet<User>(COLLECTION_NAME, systemUsers);
      if (res.fromFirestore && res.data.length > 0) {
        systemUsers = sanitizeAndSyncUsers(res.data);
        saveToStorage(systemUsers);
      }

      // Sincronizar en Firestore los usuarios autorizados y eliminar Digna si existía
      tryFirestoreDelete(COLLECTION_NAME, 'usr-admin-digna').catch(() => {});
      for (const u of systemUsers) {
        tryFirestoreSet(COLLECTION_NAME, u.id, u).catch(() => {});
      }

      isLoaded = true;
    }
  },

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await this.ensureLoaded();
    await new Promise((resolve) => setTimeout(resolve, 200));

    const trimmedInput = credentials.username.trim().toLowerCase();
    const enteredPassword = credentials.password?.trim() || '';

    // Buscar coincidencia por usuario, nombre, email o alias
    const foundUser = systemUsers.find((u) => {
      const uName = u.username.toLowerCase();
      const uFull = u.fullName.toLowerCase();
      const uEmail = u.email.toLowerCase();

      // Alias para Rodrigo Caballero
      if (
        (trimmedInput === 'rodrigo' ||
          trimmedInput === 'rodrigo caballero' ||
          trimmedInput === 'admin' ||
          trimmedInput === 'rodrigo@haciendacaballero.com') &&
        (uName.includes('rodrigo') || uFull.includes('rodrigo'))
      ) {
        return true;
      }

      // Alias para Sra. Migdalia Caballero
      if (
        (trimmedInput === 'migdalia' ||
          trimmedInput === 'migdalia caballero' ||
          trimmedInput === 'sra migdalia' ||
          trimmedInput === 'operador' ||
          trimmedInput === 'migdalia@haciendacaballero.com') &&
        (uName.includes('migdalia') || uFull.includes('migdalia'))
      ) {
        return true;
      }

      return (
        uName === trimmedInput ||
        uFull === trimmedInput ||
        uEmail === trimmedInput
      );
    });

    if (!foundUser) {
      throw new Error('Credenciales no válidas. El usuario ingresado no existe en el sistema.');
    }

    if (!foundUser.active) {
      throw new Error('Esta cuenta de usuario se encuentra inactiva o suspendida.');
    }

    // Validación de contraseña
    const expectedPassword = foundUser.password || '123456';
    if (enteredPassword !== expectedPassword) {
      throw new Error('Contraseña incorrecta. Por favor verifique la clave ingresada.');
    }

    const sessionToken = `session_token_${Date.now()}_${foundUser.id}`;
    foundUser.lastLogin = 'Ahora';
    saveToStorage(systemUsers);

    return {
      user: { ...foundUser },
      token: sessionToken,
    };
  },

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 150));
  },

  async getUsers(): Promise<User[]> {
    await this.ensureLoaded();
    return [...systemUsers];
  },

  async createUser(
    newUser: {
      fullName: string;
      email: string;
      role: UserRole;
      status?: 'Activo' | 'Inactivo';
      password?: string;
    },
    operatorName = 'Rodrigo Caballero'
  ): Promise<User> {
    await this.ensureLoaded();
    const user: User = {
      id: `usr-${Date.now()}`,
      username: newUser.email.split('@')[0],
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      active: newUser.status !== 'Inactivo',
      status: newUser.status || 'Activo',
      lastLogin: 'Nunca',
      password: newUser.password || '123456',
    };

    systemUsers.push(user);
    saveToStorage(systemUsers);

    await tryFirestoreSet(COLLECTION_NAME, user.id, user);
    return user;
  },

  async updateUser(
    userId: string,
    updates: Partial<User>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<User> {
    await this.ensureLoaded();
    const index = systemUsers.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('Usuario no encontrado');

    const updated: User = {
      ...systemUsers[index],
      ...updates,
      active: updates.status ? updates.status === 'Activo' : systemUsers[index].active,
    };
    systemUsers[index] = updated;
    saveToStorage(systemUsers);

    await tryFirestoreSet(COLLECTION_NAME, userId, updated);
    return updated;
  },

  async deleteUser(userId: string, operatorName = 'Rodrigo Caballero'): Promise<void> {
    await this.ensureLoaded();
    const target = systemUsers.find((u) => u.id === userId);
    if (!target) throw new Error('Usuario no encontrado');
    if (
      target.email === 'rodrigo@haciendacaballero.com' ||
      target.username.toLowerCase().includes('rodrigo') ||
      target.fullName.toLowerCase().includes('rodrigo')
    ) {
      throw new Error('No es posible eliminar al Administrador Rodrigo Caballero.');
    }

    systemUsers = systemUsers.filter((u) => u.id !== userId);
    saveToStorage(systemUsers);

    await tryFirestoreDelete(COLLECTION_NAME, userId);
  },

  async toggleUserStatus(userId: string): Promise<User> {
    await this.ensureLoaded();
    const user = systemUsers.find((u) => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado');
    user.active = !user.active;
    user.status = user.active ? 'Activo' : 'Inactivo';
    saveToStorage(systemUsers);

    await tryFirestoreSet(COLLECTION_NAME, userId, user);
    return { ...user };
  },

  canAccessModule(role: UserRole, module: string): boolean {
    if (role === 'ADMINISTRADOR') return true;

    // Permisos para USUARIO REGULAR (Operadora)
    const regularAllowed = [
      'inicio',
      'lecheria',
      'lechería',
      'ganado',
      'inventario',
      'productos',
      'produccion',
      'ventas',
      'cierre-diario',
    ];

    return regularAllowed.includes(module.toLowerCase());
  },
};
