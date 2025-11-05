import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Get Firebase configuration from environment variables
 */
function getFirebaseConfig(): FirebaseConfig {
  const config: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  // Validate required config
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      'Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }

  return config;
}

/**
 * Initialize Firebase App (singleton pattern)
 */
let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
    return firebaseApp;
  }

  const config = getFirebaseConfig();
  firebaseApp = initializeApp(config);
  return firebaseApp;
}

/**
 * Get Firestore instance
 */
let firestore: Firestore | null = null;

export function getFirestoreInstance(): Firestore {
  if (firestore) {
    return firestore;
  }

  const app = getFirebaseApp();
  firestore = getFirestore(app);
  return firestore;
}

/**
 * Get Firebase Auth instance
 */
let auth: Auth | null = null;

export function getAuthInstance(): Auth {
  if (auth) {
    return auth;
  }

  const app = getFirebaseApp();
  auth = getAuth(app);
  return auth;
}

/**
 * Firestore Collection Names
 */
export const COLLECTIONS = {
  USERS: 'users',
  CHATS: 'chats',
  MESSAGES: 'messages',
  PAYMENTS: 'payments',
  WALLETS: 'wallets',
  CALLS: 'calls',
  BATTLES: 'battles',
  LIVEPARTIES: 'liveparties',
  TRANSACTIONS: 'transactions',
  LIVESTREAMS: 'livestreams',
  TIPS: 'tips',
  FLAMES: 'flames',
  LIKES: 'likes',
  MATCHES: 'matches',
} as const;

/**
 * Initialize Firebase (call this on app startup)
 */
export function initializeFirebase(): {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  const app = getFirebaseApp();
  const db = getFirestoreInstance();
  const authInstance = getAuthInstance();

  return {
    app,
    firestore: db,
    auth: authInstance,
  };
}

