import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase with SSR compatibility safeguard
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Only initialize auth if we are in a browser environment
const auth = typeof window !== 'undefined' ? getAuth(app) : null;
const db = getFirestore(app);
const storage = getStorage(app);

if (auth) {
  // Use browserLocalPersistence so the session survives page refreshes and browser restarts.
  // The auth state is stored in IndexedDB and recovered automatically by onAuthStateChanged.
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

export { auth, app, db, storage };

