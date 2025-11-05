'use client';

/**
 * Home Page with Auth Flow
 * 
 * Flow: Splash → IntroCarousel → Login → ProfileSetup → Discover
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Splash, IntroCarousel } from '@/components/splash';
import { useAuth } from '@/contexts/AuthContext';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import ChatContainer from '@/components/layout/ChatContainer';
import type { ChatRoom, User } from '@/types/chat';
import type { FirestoreMessage } from '@/lib/firestore-collections';

export default function Home() {
  const { user, loading: authLoading, isProfileComplete } = useAuth();
  const router = useRouter();
  
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [showApp, setShowApp] = useState(false);

  // Check if user has seen intro before
  useEffect(() => {
    const checkIntroStatus = () => {
      const hasSeenIntro = localStorage.getItem('litit-has-seen-intro');
      if (hasSeenIntro === 'true') {
        setShowSplash(false);
        setShowIntro(false);
      }
    };
    checkIntroStatus();
  }, []);

  // Handle auth state and routing
  useEffect(() => {
    if (authLoading) return;

    // If user is logged in, check profile completion
    if (user) {
      if (!isProfileComplete) {
        // Redirect to profile setup
        router.push('/onboarding/profile');
        return;
      } else {
        // User has complete profile, show app
        // Use setTimeout to avoid setState in effect
        setTimeout(() => {
          setShowSplash(false);
          setShowIntro(false);
          setShowApp(true);
        }, 0);
        return;
      }
    }

    // User not logged in, show login flow after intro
    if (!showSplash && !showIntro && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, isProfileComplete, showSplash, showIntro, router]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowIntro(true);
  };

  const handleIntroComplete = () => {
    localStorage.setItem('litit-has-seen-intro', 'true');
    setShowIntro(false);
    
    // If user is not logged in, redirect to login
    if (!user) {
      router.push('/auth/login');
    }
  };

  // Mock data for demonstration
  const mockUser: User = {
    id: user?.uid || '1',
    name: user?.displayName || 'User',
    status: 'online',
  };

  const mockRooms: ChatRoom[] = [];
  const mockMessages: FirestoreMessage[] = [];

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show splash/intro if user hasn't seen them
  if (showSplash || showIntro) {
    return (
      <AnimatePresence mode="wait">
        {showSplash && (
          <Splash
            key="splash"
            onComplete={handleSplashComplete}
            duration={2500}
          />
        )}

        {!showSplash && showIntro && (
          <IntroCarousel
            key="intro"
            onComplete={handleIntroComplete}
          />
        )}
      </AnimatePresence>
    );
  }

  // Show app if user is logged in and profile is complete
  if (user && isProfileComplete && showApp) {
    return (
      <ResponsiveLayout>
        <ChatContainer
          rooms={mockRooms}
          messages={mockMessages}
          currentUser={mockUser}
          isConnected={false}
          onSendMessage={() => {}}
          onRoomSelect={() => {}}
        />
      </ResponsiveLayout>
    );
  }

  // Default: show loading
  return (
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
