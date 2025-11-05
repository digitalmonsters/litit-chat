/**
 * Firebase Cloud Messaging (FCM) Setup
 * 
 * Handles push notifications for PWA
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirebaseApp } from './firebase';

let messaging: Messaging | null = null;

/**
 * Initialize Firebase Messaging
 */
export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') {
    return null; // Server-side, return null
  }

  if (messaging) {
    return messaging;
  }

  try {
    const app = getFirebaseApp();
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
    return null;
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) {
    console.error('Firebase Messaging not initialized');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('NEXT_PUBLIC_FIREBASE_VAPID_KEY not set');
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey,
    });

    if (token) {
      console.log('✅ FCM token obtained:', token);
      // Store token in Firestore or send to backend
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onMessageListener(): Promise<{
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    image?: string;
  };
  data?: Record<string, string>;
}> {
  return new Promise((resolve) => {
    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) {
      resolve({});
      return;
    }

    onMessage(messagingInstance, (payload) => {
      console.log('📨 Foreground message received:', payload);
      resolve({
        notification: payload.notification,
        data: payload.data as Record<string, string>,
      });
    });
  });
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  return Notification.permission;
}

