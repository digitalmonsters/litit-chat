'use client';

import React, { useEffect } from 'react';
import { setupInstallPrompt } from '@/lib/pwa-install';
import { onMessageListener } from '@/lib/firebase-messaging';
import { requestNotificationPermission, setupForegroundMessageHandler } from '@/lib/firebase';

export interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Setup PWA install prompt
    setupInstallPrompt();

    // Register Firebase Messaging service worker
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Firebase Messaging service worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Error registering Firebase Messaging service worker:', error);
        });
    }

    // Request notification permission and initialize FCM
    requestNotificationPermission();

    // Setup foreground message handler
    setupForegroundMessageHandler();

    // Listen for foreground messages
    onMessageListener().then((payload) => {
      if (payload.notification) {
        // Show notification UI
        console.log('📨 New message:', payload.notification);
        // You can show a toast or notification UI here
      }
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service worker updated, reloading...');
        window.location.reload();
      });
    }
  }, []);

  return <>{children}</>;
}

