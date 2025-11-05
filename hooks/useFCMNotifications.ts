'use client';

import { useEffect } from 'react';
import { onMessageListener } from '@/lib/firebase-messaging';

export interface FCMNotificationPayload {
  title?: string;
  body?: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
}

export interface UseFCMNotificationsOptions {
  onNotification?: (payload: FCMNotificationPayload) => void;
  enabled?: boolean;
}

/**
 * Hook to listen for FCM push notifications
 * Integrates with PushBanner for displaying foreground notifications
 */
export function useFCMNotifications({
  onNotification,
  enabled = true,
}: UseFCMNotificationsOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    // Listen for foreground messages
    const listenForMessages = async () => {
      try {
        const payload = await onMessageListener();
        
        if (payload.notification) {
          console.log('📨 FCM notification received:', payload.notification);
          
          if (onNotification) {
            onNotification({
              title: payload.notification.title,
              body: payload.notification.body,
              icon: payload.notification.icon,
              image: payload.notification.image,
              data: payload.data,
            });
          }
        }
      } catch (error) {
        console.error('Error listening for FCM messages:', error);
      }
    };

    // Start listening (runs continuously)
    listenForMessages();
  }, [enabled, onNotification]);
}
