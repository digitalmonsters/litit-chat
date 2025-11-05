'use client';

/**
 * Wallet Context
 * 
 * Provides real-time wallet balance updates throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { getOrCreateWallet } from '@/lib/wallet';
import type { FirestoreWallet } from '@/lib/firestore-collections';
import { useAuth } from './AuthContext';

interface WalletContextType {
  wallet: FirestoreWallet | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<FirestoreWallet | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh wallet data
  const refreshWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      const walletData = await getOrCreateWallet(user.uid);
      setWallet(walletData);
    } catch (err) {
      console.error('Error refreshing wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time listener for wallet
  useEffect(() => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const firestore = getFirestoreInstance();
    const walletRef = doc(firestore, COLLECTIONS.WALLETS, user.uid);

    // Initialize wallet if it doesn't exist
    getOrCreateWallet(user.uid).catch((err) => {
      console.error('Error initializing wallet:', err);
    });

    // Set up real-time listener
    const unsubscribe: Unsubscribe = onSnapshot(
      walletRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const walletData = {
            id: snapshot.id,
            ...snapshot.data(),
          } as FirestoreWallet;
          setWallet(walletData);
        } else {
          // Wallet doesn't exist yet, create it
          getOrCreateWallet(user.uid)
            .then((walletData) => {
              setWallet(walletData);
            })
            .catch((err) => {
              console.error('Error creating wallet:', err);
            });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to wallet:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const value: WalletContextType = {
    wallet,
    loading,
    refreshWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

