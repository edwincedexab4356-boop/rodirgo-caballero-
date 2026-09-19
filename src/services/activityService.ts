/**
 * SERVICIO DE ACTIVIDAD Y AUDITORÍA DEL SISTEMA
 * 
 * [ARQUITECTURA PREPARADA PARA FIRESTORE]:
 * Mapeo con colección "actividad":
 * - addDoc(collection(db, "actividad"), { ...activity, timestamp: serverTimestamp() })
 * - query(collection(db, "actividad"), orderBy("timestamp", "desc"), limit(50))
 */

import { AuditActivity, UserRole } from '../types';
import { INITIAL_ACTIVITIES } from '../data/mockData';

let activitiesStore: AuditActivity[] = [...INITIAL_ACTIVITIES];

export interface NewActivityParams {
  userId?: string;
  userName: string;
  role?: UserRole;
  action: string;
  module: AuditActivity['module'];
  details?: string;
}

export const activityService = {
  async getAll(): Promise<AuditActivity[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [...activitiesStore];
  },

  log(params: NewActivityParams): AuditActivity {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newActivity: AuditActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId || 'usr-system',
      userName: params.userName,
      role: params.role || 'ADMINISTRADOR',
      action: params.action,
      module: params.module,
      date: dateStr,
      time: timeStr,
      details: params.details,
    };

    // Agregar al inicio
    activitiesStore.unshift(newActivity);
    return newActivity;
  },

  async clearOldActivities(): Promise<void> {
    // Mantener últimas 100 actividades
    activitiesStore = activitiesStore.slice(0, 100);
  }
};
