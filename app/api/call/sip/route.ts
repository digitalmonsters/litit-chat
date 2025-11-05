import { NextRequest, NextResponse } from 'next/server';
import { startSIPAudio } from '@/lib/hms-client';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { FirestoreCall } from '@/lib/firestore-collections';
import { getAuthenticatedUserId } from '@/lib/auth-server';

/**
 * POST /api/call/sip
 * 
 * Start SIP audio session (bridge to HMS_SIP_ENDPOINT)
 * 
 * Body:
 * {
 *   callId: string;
 *   phoneNumber: string;
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
    const { callId, phoneNumber } = body;

    if (!callId || !phoneNumber) {
      return NextResponse.json(
        { error: 'callId and phoneNumber are required' },
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

    // Verify user is the host
    if (callData.hostId !== userId) {
      return NextResponse.json(
        { error: 'Only the call host can start SIP audio' },
        { status: 403 }
      );
    }

    // Verify call is SIP-enabled
    if (!callData.sipEnabled && callData.type !== 'sip') {
      return NextResponse.json(
        { error: 'This call is not configured for SIP' },
        { status: 400 }
      );
    }

    // Start SIP audio session
    const sipResponse = await startSIPAudio({
      room_id: callData.roomId,
      phone_number: phoneNumber,
    });

    // Update call record
    await updateDoc(callRef, {
      sipPhoneNumber: phoneNumber,
      status: 'active',
      updatedAt: serverTimestamp(),
      metadata: {
        ...callData.metadata,
        sipSessionId: sipResponse.id,
        sipStatus: sipResponse.status,
      },
    });

    console.log(`✅ SIP audio started for call ${callId} (SIP session: ${sipResponse.id})`);

    return NextResponse.json(
      {
        success: true,
        sip: {
          id: sipResponse.id,
          roomId: callData.roomId,
          phoneNumber,
          status: sipResponse.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting SIP audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to start SIP audio',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
