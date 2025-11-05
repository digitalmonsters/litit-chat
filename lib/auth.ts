/**
 * Firebase Authentication Utilities
 * 
 * Handles authentication methods: Google, Apple, Facebook, Phone, Magic Link
 */

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signOut as firebaseSignOut,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getAuthInstance, getFirestoreInstance } from './firebase';
import { COLLECTIONS } from './firebase';
import type { FirestoreUser } from './firestore-collections';

/**
 * Authentication Provider Types
 */
export type AuthProvider = 'google' | 'apple' | 'facebook' | 'phone' | 'email';

/**
 * Get provider name from User object
 */
function getProviderFromUser(user: User): string {
  if (user.providerData.length === 0) return 'anonymous';
  
  const providerId = user.providerData[0]?.providerId || '';
  
  if (providerId.includes('google')) return 'google';
  if (providerId.includes('apple')) return 'apple';
  if (providerId.includes('facebook')) return 'facebook';
  if (providerId.includes('phone')) return 'phone';
  if (providerId.includes('password')) return 'email';
  
  return 'anonymous';
}

/**
 * Create or update user document in Firestore
 */
export async function createOrUpdateUser(
  user: User,
  additionalData?: Partial<FirestoreUser>
): Promise<FirestoreUser> {
  const auth = getAuthInstance();
  const db = getFirestoreInstance();
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  
  // Check if user document exists
  const userSnap = await getDoc(userRef);
  
  const provider = getProviderFromUser(user);
  const now = Timestamp.now();
  
  const userData: Partial<FirestoreUser> = {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'User',
    photoURL: user.photoURL || undefined,
    provider,
    lastLogin: now,
    updatedAt: now,
    ...additionalData,
  };

  if (!userSnap.exists()) {
    // Create new user document
    userData.createdAt = now;
    userData.verified = false;
    userData.tier = 'free';
    userData.status = 'offline';
    userData.lastSeen = now;
    
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } else {
    // Update existing user
    await setDoc(
      userRef,
      {
        ...userData,
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const firestoreUser = {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'User',
    photoURL: user.photoURL || undefined,
    provider,
    verified: userSnap.exists() ? (userSnap.data()?.verified || false) : false,
    tier: userSnap.exists() ? (userSnap.data()?.tier || 'free') : 'free',
    status: 'offline',
    lastSeen: now,
    createdAt: userSnap.exists() ? userSnap.data()?.createdAt || now : now,
    updatedAt: now,
    lastLogin: now,
    ...additionalData,
  } as FirestoreUser;

  // Sync to GHL in background (don't await - fire and forget)
  if (typeof window === 'undefined') {
    // Server-side: import and call sync
    import('./ghl-sync')
      .then(({ syncUserToGHL }) => syncUserToGHL(user.uid))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Background GHL sync failed:', error);
      });
  }

  return firestoreUser;
}

/**
 * Check if user profile is complete
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  const db = getFirestoreInstance();
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return false;
  
  const data = userSnap.data() as FirestoreUser;
  return data.verified === true;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getAuthInstance();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  
  try {
    // Try popup first (better UX)
    return await signInWithPopup(auth, provider);
  } catch (error) {
    // Fallback to redirect if popup blocked
    const authError = error as AuthError;
    if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
      // Note: redirect will navigate away, so this won't return
      throw new Error('Redirecting to Google sign-in...');
    }
    throw error;
  }
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(): Promise<UserCredential> {
  const auth = getAuthInstance();
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
      throw new Error('Redirecting to Apple sign-in...');
    }
    throw error;
  }
}

/**
 * Sign in with Facebook
 */
export async function signInWithFacebook(): Promise<UserCredential> {
  const auth = getAuthInstance();
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
      throw new Error('Redirecting to Facebook sign-in...');
    }
    throw error;
  }
}

/**
 * Send magic link to email
 */
export async function sendMagicLink(email: string): Promise<void> {
  const auth = getAuthInstance();
  const actionCodeSettings = {
    url: `${window.location.origin}/auth/callback`,
    handleCodeInApp: true,
  };
  
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  
  // Store email in localStorage for completion
  localStorage.setItem('litit-email-for-signin', email);
}

/**
 * Sign in with magic link (email link)
 */
export async function signInWithMagicLink(email: string, emailLink: string): Promise<UserCredential> {
  const auth = getAuthInstance();
  return await signInWithEmailLink(auth, email, emailLink);
}

/**
 * Check if current URL is a magic link
 */
export function isMagicLink(url: string): boolean {
  return isSignInWithEmailLink(getAuthInstance(), url);
}

/**
 * Initialize phone authentication
 */
export function initializePhoneAuth(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  const auth = getAuthInstance();
  
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber to be called
    },
    'expired-callback': () => {
      // Response expired, ask user to solve reCAPTCHA again
      console.warn('reCAPTCHA expired');
    },
  });
  
  return recaptchaVerifier;
}

/**
 * Send SMS verification code
 */
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ confirmation: { verificationId: string }; verifier: RecaptchaVerifier }> {
  const auth = getAuthInstance();
  const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return { confirmation, verifier: recaptchaVerifier };
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const auth = getAuthInstance();
  await firebaseSignOut(auth);
}

/**
 * Get redirect result (for OAuth redirects)
 */
export async function getAuthRedirectResult(): Promise<UserCredential | null> {
  const auth = getAuthInstance();
  return await getRedirectResult(auth);
}

