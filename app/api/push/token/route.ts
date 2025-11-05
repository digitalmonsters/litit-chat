import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthenticatedUserId } from '@/lib/auth-server';

/**
 * POST /api/push/token
 * 
 * Save FCM token to user document
 * 
 * Body:
 * {
 *   fcmToken: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid Firebase Auth token.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fcmToken } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json(
        { error: 'fcmToken is required and must be a string' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();
    const userRef = doc(firestore, COLLECTIONS.USERS, userId);

    // Update user document with FCM token
    await updateDoc(userRef, {
      fcmToken,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ FCM token saved for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'FCM token saved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving FCM token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to save FCM token',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/token
 * 
 * Remove FCM token from user document
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid Firebase Auth token.' },
        { status: 401 }
      );
    }

    const firestore = getFirestoreInstance();
    const userRef = doc(firestore, COLLECTIONS.USERS, userId);

    // Remove FCM token from user document
    await updateDoc(userRef, {
      fcmToken: null,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ FCM token removed for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'FCM token removed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing FCM token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to remove FCM token',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

