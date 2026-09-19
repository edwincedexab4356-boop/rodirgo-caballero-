/**
 * SERVICIO DE CONFIGURACIÓN DEL RANCHO - PERSISTENCIA WEB Y FIRESTORE
 * Colección: 'settings', Documento: 'ranch_config'
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { tryFirestoreSet } from './firestoreHelper';
import { activityService } from './activityService';

export interface RanchConfig {
  ranchName: string;
  ownerName: string;
  taxId: string;
  location: string;
  totalHectares: number;
  currencySymbol: string;
  weightUnit: string;
  volumeUnit: string;
  notificationEmail: string;
  autoCloseDay: boolean;
  updatedAt?: string;
}

export const DEFAULT_CONFIG: RanchConfig = {
  ranchName: 'Hacienda Ganadera Caballero',
  ownerName: 'Rodrigo Caballero',
  taxId: 'J-30492819-0',
  location: 'Valle de San Sebastián, Sector Las Palmas',
  totalHectares: 480,
  currencySymbol: 'USD ($)',
  weightUnit: 'Kilogramos (kg)',
  volumeUnit: 'Litros (L)',
  notificationEmail: 'rodrigo@haciendacaballero.com',
  autoCloseDay: false,
};

const LOCAL_STORAGE_KEY = 'agrogestion_ranch_settings';
const COLLECTION_NAME = 'settings';
const DOC_ID = 'ranch_config';

let cachedConfig: RanchConfig | null = null;
let isLoaded = false;

function loadFromStorage(): RanchConfig {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
    return { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveToStorage(config: RanchConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error al guardar configuración en localStorage:', err);
  }
}

export const settingsService = {
  async getConfig(): Promise<RanchConfig> {
    if (!isLoaded) {
      cachedConfig = loadFromStorage();

      try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as RanchConfig;
          cachedConfig = { ...DEFAULT_CONFIG, ...remoteData };
          saveToStorage(cachedConfig);
        }
      } catch (err: any) {
        console.warn('[settingsService] Leyendo configuración de caché local:', err?.message);
      }

      isLoaded = true;
    }

    return cachedConfig ? { ...cachedConfig } : { ...DEFAULT_CONFIG };
  },

  async saveConfig(
    newConfig: RanchConfig,
    operatorName = 'Rodrigo Caballero'
  ): Promise<{ success: boolean; fromFirestore: boolean; message: string }> {
    const toSave: RanchConfig = {
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };

    // 1. Guardar de inmediato en almacenamiento local web (localStorage)
    cachedConfig = toSave;
    saveToStorage(toSave);

    // 2. Intentar guardar en Firebase Firestore
    let fromFirestore = false;
    let message = 'Configuración guardada exitosamente en la web local.';

    try {
      const savedInFirestore = await tryFirestoreSet(COLLECTION_NAME, DOC_ID, toSave);
      if (savedInFirestore) {
        fromFirestore = true;
        message = 'Configuración sincronizada exitosamente en Firebase Firestore y en la web.';
      } else {
        message =
          'Configuración guardada en la web local. En Firebase Firestore está pendiente actualizar las reglas de seguridad.';
      }
    } catch {
      message = 'Configuración guardada localmente en la web.';
    }

    // 3. Registrar auditoría
    await activityService.log({
      userId: 'usr-admin-rodrigo',
      userName: operatorName,
      role: 'ADMINISTRADOR',
      action: 'Actualización de Configuración del Rancho',
      module: 'Configuración',
      details: `Hacienda: ${toSave.ranchName}, Propietario: ${toSave.ownerName}, Moneda: ${toSave.currencySymbol}`,
    });

    return { success: true, fromFirestore, message };
  },
};
