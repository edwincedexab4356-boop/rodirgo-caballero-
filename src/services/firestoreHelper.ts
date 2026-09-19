import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';

export type FirestoreConnectionStatus = 'connected' | 'rules-blocked' | 'error' | 'syncing';

let currentStatus: FirestoreConnectionStatus = 'syncing';
const statusListeners: ((status: FirestoreConnectionStatus, message?: string) => void)[] = [];

export function subscribeToFirestoreStatus(
  callback: (status: FirestoreConnectionStatus, message?: string) => void
) {
  statusListeners.push(callback);
  callback(currentStatus);
  return () => {
    const idx = statusListeners.indexOf(callback);
    if (idx !== -1) statusListeners.splice(idx, 1);
  };
}

function notifyStatus(status: FirestoreConnectionStatus, message?: string) {
  currentStatus = status;
  statusListeners.forEach((cb) => cb(status, message));
}

/**
 * Intenta leer una colección de Firestore.
 * Si las reglas de seguridad tienen 'allow read, write: if false',
 * atrapa el error 'permission-denied' sin romper la aplicación y notifica al usuario.
 */
export async function tryFirestoreGet<T>(
  collectionName: string,
  fallbackData: T[]
): Promise<{ data: T[]; fromFirestore: boolean }> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const remoteData: T[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as unknown as T[];
      notifyStatus('connected', 'Conectado exitosamente a Firebase Firestore');
      return { data: remoteData, fromFirestore: true };
    } else {
      notifyStatus('connected', 'Colección vacía en Firestore');
      return { data: fallbackData, fromFirestore: true };
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      notifyStatus(
        'rules-blocked',
        'Firestore activo pero bloqueado por reglas de seguridad (allow read, write: if false)'
      );
    } else {
      notifyStatus('error', err?.message || 'Error de conexión Firestore');
    }
    return { data: fallbackData, fromFirestore: false };
  }
}

/**
 * Guarda o actualiza un documento en Firestore.
 */
export async function tryFirestoreSet(
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    notifyStatus('connected', 'Guardado en Firestore');
    return true;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      notifyStatus(
        'rules-blocked',
        'Operación en memoria: Firestore bloqueado por reglas (allow read, write: if false)'
      );
    } else {
      console.warn(`[Firestore ${collectionName}] Error al guardar:`, err);
    }
    return false;
  }
}

/**
 * Elimina un documento en Firestore.
 */
export async function tryFirestoreDelete(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    notifyStatus('connected', 'Documento eliminado en Firestore');
    return true;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      notifyStatus('rules-blocked', 'Reglas Firestore requieren permisos de escritura');
    } else {
      console.warn(`[Firestore ${collectionName}] Error al eliminar:`, err);
    }
    return false;
  }
}
