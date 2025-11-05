'use client';

/**
 * Firebase Authentication Context
 * 
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import {
  createOrUpdateUser,
  isProfileComplete as checkProfileComplete,
  signInWithGoogle,
  signInWithApple,
  signInWithFacebook,
  sendMagicLink,
  signInWithMagicLink,
  isMagicLink,
  signOut,
  getAuthRedirectResult,
} from '@/lib/auth';
import { initializeFCM } from '@/lib/firebase-messaging';
import type { FirestoreUser } from '@/lib/firestore-collections';

interface AuthContextType {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  loading: boolean;
  isProfileComplete: boolean;
  
  // Auth methods
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithMagicLink: (email: string, emailLink: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Refresh user data
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Refresh Firestore user data
  const refreshUser = useCallback(async () => {
    if (!user) {
      setFirestoreUser(null);
      setIsProfileComplete(false);
      return;
    }

    try {
      const fsUser = await createOrUpdateUser(user);
      setFirestoreUser(fsUser);
      
      const complete = await checkProfileComplete(user.uid);
      setIsProfileComplete(complete);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error refreshing user:', err);
    }
  }, [user]);

  // Handle auth state changes
  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        try {
          const fsUser = await createOrUpdateUser(authUser);
          setFirestoreUser(fsUser);
          
          const complete = await checkProfileComplete(authUser.uid);
          setIsProfileComplete(complete);
          
          // Initialize FCM and save token
          try {
            await initializeFCM();
          } catch (fcmError) {
            // eslint-disable-next-line no-console
            console.warn('Error initializing FCM:', fcmError);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Error creating/updating user:', err);
        }
      } else {
        setFirestoreUser(null);
        setIsProfileComplete(false);
      }
      
      setLoading(false);
    });

    // Check for redirect result
    getAuthRedirectResult()
      .then((result) => {
        if (result?.user) {
          // eslint-disable-next-line no-console
          console.log('OAuth redirect successful');
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('OAuth redirect error:', err);
      });

    return () => unsubscribe();
  }, []);

  // Auth methods
  const handleSignInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithGoogle();
      await createOrUpdateUser(result.user);
      await refreshUser();
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }, [refreshUser]);

  const handleSignInWithApple = useCallback(async () => {
    try {
      const result = await signInWithApple();
      await createOrUpdateUser(result.user);
      await refreshUser();
    } catch (error) {
      console.error('Apple sign-in error:', error);
      throw error;
    }
  }, [refreshUser]);

  const handleSignInWithFacebook = useCallback(async () => {
    try {
      const result = await signInWithFacebook();
      await createOrUpdateUser(result.user);
      await refreshUser();
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      throw error;
    }
  }, [refreshUser]);

  const handleSendMagicLink = useCallback(async (email: string) => {
    try {
      await sendMagicLink(email);
    } catch (error) {
      console.error('Magic link error:', error);
      throw error;
    }
  }, []);

  const handleSignInWithMagicLink = useCallback(async (email: string, emailLink: string) => {
    try {
      const result = await signInWithMagicLink(email, emailLink);
      await createOrUpdateUser(result.user);
      await refreshUser();
    } catch (error) {
      console.error('Magic link sign-in error:', error);
      throw error;
    }
  }, [refreshUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setFirestoreUser(null);
      setIsProfileComplete(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    firestoreUser,
    loading,
    isProfileComplete,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    signInWithFacebook: handleSignInWithFacebook,
    sendMagicLink: handleSendMagicLink,
    signInWithMagicLink: handleSignInWithMagicLink,
    signOut: handleSignOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

