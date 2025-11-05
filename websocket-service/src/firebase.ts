import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firestore: admin.firestore.Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebaseAdmin(): admin.firestore.Firestore {
  if (firestore) {
    return firestore;
  }

  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      firestore = admin.firestore();
      return firestore;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }

    // Try to load service account key from file
    const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    if (serviceAccountKeyPath && fs.existsSync(serviceAccountKeyPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountKeyPath, 'utf8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Use individual credentials from environment
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId,
      });
    } else {
      // Try default credentials (for GCP environments)
      admin.initializeApp({
        projectId,
      });
    }

    firestore = admin.firestore();
    console.log('✅ Firebase Admin initialized');
    return firestore;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

/**
 * Get Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!firestore) {
    return initializeFirebaseAdmin();
  }
  return firestore;
}

