import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase (permite personalización vía variables de entorno)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXctj-CqrLq7BoJMK0L6KUknnZ0MKifaY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gestion-ganadera-web.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gestion-ganadera-web",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gestion-ganadera-web.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "270812337925",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:270812337925:web:37a6c4a8965e3bd5e0c96c"
};

// Inicialización de Firebase
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

export default firebaseApp;
