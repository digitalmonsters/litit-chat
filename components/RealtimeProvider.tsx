'use client';

/**
 * Realtime Provider Component
 * 
 * Integrates FCM notifications, presence tracking, and push banners
 */

import React, { useEffect, useState } from 'react';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { useFCMNotifications } from '@/hooks/useFCMNotifications';
import { initializeFCM } from '@/lib/firebase-messaging';
import { useAuth } from '@/contexts/AuthContext';

// Note: PushBannerProvider and PushNotification types would need to be created
// For now, we'll comment out the push banner integration
// import { PushBannerProvider } from '@/components/ui/PushBannerProvider';
// import type { PushNotification } from '@/components/ui/PushBanner';

interface PushNotification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  image?: string;
  timestamp: Date;
  action?: string;
  link?: string;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides all realtime features
 * - FCM push notifications
 * - User presence tracking
 * - Push notification banners
 */
export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuth();
  const [pushNotifications, setPushNotifications] = useState<PushNotification[]>([]);

  // Initialize FCM when user is authenticated
  useEffect(() => {
    if (user) {
      initializeFCM().then((token) => {
        if (token) {
          console.log('✅ FCM initialized with token:', token);
        }
      });
    }
  }, [user]);

  // Handle incoming FCM notifications
  useFCMNotifications({
    enabled: !!user,
    onNotification: (payload) => {
      // Convert FCM payload to PushNotification format
      const notification: PushNotification = {
        id: `fcm-${Date.now()}`,
        title: payload.title || 'New Notification',
        message: payload.body || '',
        icon: payload.icon,
        image: payload.image,
        timestamp: new Date(),
        action: payload.data?.action,
        link: payload.data?.link,
      };

      setPushNotifications((prev) => [...prev, notification]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setPushNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    },
  });

  return (
    <PresenceProvider>
      {/* TODO: Integrate PushBannerProvider when available */}
      {children}
    </PresenceProvider>
  );
}

export default RealtimeProvider;
