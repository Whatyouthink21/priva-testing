import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDg0D51XL2kYvVQCyVJu_zTlZyYHjs6EgA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'priva-movies.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'priva-movies',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'priva-movies.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || '771882692538',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:771882692538:web:ddb8f87ab08fd44e8bb783',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0T1DQQH4L1',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics is optional and must never break the app (it throws in some
// environments, e.g. without cookies or on unsupported browsers).
export async function initAnalytics() {
  if (typeof window === 'undefined' || !firebaseConfig.measurementId) return null;
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (!(await isSupported())) return null;
    return getAnalytics(app);
  } catch {
    return null;
  }
}
