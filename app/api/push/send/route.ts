import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { getAuthenticatedUserId } from '@/lib/auth-server';

// Server-only: Firebase Admin is only available on the server
if (typeof window !== 'undefined') {
  throw new Error('firebase-admin can only be used on the server');
}

// Initialize Firebase Admin for FCM
let admin: typeof import('firebase-admin') | null = null;
let messaging: any = null;

async function getAdminMessaging() {
  // Server-only guard
  if (typeof window !== 'undefined') {
    throw new Error('firebase-admin can only be used on the server');
  }

  if (!admin) {
    admin = await import('firebase-admin');
    
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccount) {
          const serviceAccountKey = JSON.parse(serviceAccount);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
          });
        } else {
          // Try default initialization (for Firebase hosted environments)
          admin.initializeApp();
        }
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw new Error('Firebase Admin not initialized');
      }
    }
    
    messaging = admin.messaging();
  }
  
  return messaging;
}

/**
 * POST /api/push/send
 * 
 * Send push notification via FCM
 * 
 * Body:
 * {
 *   userId?: string; // Target user ID (optional, defaults to current user)
 *   userIds?: string[]; // Multiple user IDs
 *   title: string;
 *   body: string;
 *   data?: Record<string, string>; // Additional data payload
 *   image?: string; // Image URL
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const currentUserId = await getAuthenticatedUserId(request);
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid Firebase Auth token.' },
        { status: 401 }
      );
    }

    const bodyData = await request.json();
    const { userId, userIds, title, body: messageBody, data, image } = bodyData;

    // Validate required fields
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      );
    }

    // Determine target user IDs
    let targetUserIds: string[] = [];
    if (userIds && Array.isArray(userIds)) {
      targetUserIds = userIds;
    } else if (userId) {
      targetUserIds = [userId];
    } else {
      // Default to current user
      targetUserIds = [currentUserId];
    }

    const firestore = getFirestoreInstance();
    const results = [];

    // Get FCM tokens for target users
    for (const targetUserId of targetUserIds) {
      try {
        const userRef = doc(firestore, COLLECTIONS.USERS, targetUserId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn(`User ${targetUserId} not found`);
          results.push({
            userId: targetUserId,
            success: false,
            error: 'User not found',
          });
          continue;
        }

        const userData = userSnap.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
          console.warn(`No FCM token for user ${targetUserId}`);
          results.push({
            userId: targetUserId,
            success: false,
            error: 'No FCM token',
          });
          continue;
        }

        // Get admin messaging instance
        const messagingInstance = await getAdminMessaging();
        
        // Build notification payload
        const message: any = {
          token: fcmToken,
          notification: {
            title,
            body: messageBody,
            ...(image && { imageUrl: image }),
          },
          ...(data && {
            data: Object.fromEntries(
              Object.entries(data).map(([key, value]) => [key, String(value)])
            ),
          }),
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
          webpush: {
            notification: {
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
            },
          },
        };

        // Send notification
        const response = await messagingInstance.send(message);

        console.log(`✅ Push notification sent to ${targetUserId}: ${response}`);
        results.push({
          userId: targetUserId,
          success: true,
          messageId: response,
        });
      } catch (error) {
        console.error(`❌ Error sending push to ${targetUserId}:`, error);
        results.push({
          userId: targetUserId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json(
      {
        success: successCount > 0,
        sent: successCount,
        failed: failureCount,
        results,
      },
      { status: successCount > 0 ? 200 : 500 }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to send push notification',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}


