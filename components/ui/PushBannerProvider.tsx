'use client';

/**
 * Push Banner Provider
 * 
 * Manages FCM push notifications and displays them as in-app banners
 */

import React, { useEffect, useState, useCallback } from 'react';
import { onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '@/lib/firebase-messaging';
import PushBanner, { type PushNotification } from './PushBanner';

export interface PushBannerProviderProps {
  children: React.ReactNode;
}

export default function PushBannerProvider({
  children,
}: PushBannerProviderProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<PushNotification | null>(null);

  // Handle FCM onMessage
  useEffect(() => {
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.warn('Firebase Messaging not available');
      return;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received:', payload);

      const notification: PushNotification = {
        id: `push-${Date.now()}-${Math.random()}`,
        title: payload.notification?.title || 'New Message',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        image: payload.notification?.image,
        timestamp: new Date(),
        onClick: () => {
          // Handle notification click
          if (payload.data?.chatId) {
            window.location.href = `/chat/${payload.data.chatId}`;
          }
        },
      };

      setNotifications((prev) => [...prev, notification]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Show notifications one at a time
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      setCurrentNotification(notifications[0]);
    }
  }, [notifications, currentNotification]);

  const handleDismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setCurrentNotification(null);
  }, []);

  return (
    <>
      {children}
      <PushBanner
        notification={currentNotification}
        onDismiss={handleDismiss}
        duration={5000}
      />
    </>
  );
}

