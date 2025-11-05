import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/hms-client';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { FirestoreCall } from '@/lib/firestore-collections';
import { getAuthenticatedUserId } from '@/lib/auth-server';

/**
 * POST /api/call/token
 * 
 * Generate JWT token for participant to join a 100ms room
 * 
 * Body:
 * {
 *   callId: string; // Firestore call ID
 *   role?: string; // HMS role (default: 'guest')
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
    const { callId, role = 'guest' } = body;

    if (!callId) {
      return NextResponse.json(
        { error: 'callId is required' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Get call record
    const callRef = doc(firestore, COLLECTIONS.CALLS, callId);
    const callSnap = await getDoc(callRef);

    if (!callSnap.exists()) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    const callData = callSnap.data() as FirestoreCall;

    // Verify user is a participant
    if (!callData.participantIds.includes(userId) && callData.hostId !== userId) {
      return NextResponse.json(
        { error: 'User is not a participant in this call' },
        { status: 403 }
      );
    }

    // Generate HMS token
    const tokenResponse = await generateToken({
      room_id: callData.roomId,
      user_id: userId,
      role,
      metadata: {
        callId,
        participantId: userId,
      },
    });

    console.log(`✅ Token generated for user ${userId} in call ${callId}`);

    return NextResponse.json(
      {
        success: true,
        token: tokenResponse.token,
        roomId: tokenResponse.room_id,
        userId: tokenResponse.user_id,
        role: tokenResponse.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to generate token',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
