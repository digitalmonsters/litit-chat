import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/hms-client';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestoreCall } from '@/lib/firestore-collections';
import { getAuthenticatedUserId } from '@/lib/auth-server';
import { checkCallBalance, DEFAULT_RATE_PER_MINUTE_STARS } from '@/lib/call-billing';

/**
 * POST /api/call/initiate
 * 
 * Create a 100ms room for a call
 * 
 * Body:
 * {
 *   type: 'direct' | 'group' | 'sip';
 *   receiverId?: string; // For direct calls
 *   participantIds?: string[]; // For group calls
 *   sipPhoneNumber?: string; // For SIP calls
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
    const { type, receiverId, participantIds, sipPhoneNumber } = body;

    // Validate call type
    if (!type || !['direct', 'group', 'sip'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid call type. Must be: direct, group, or sip' },
        { status: 400 }
      );
    }

    // Validate participants based on type
    if (type === 'direct' && !receiverId) {
      return NextResponse.json(
        { error: 'receiverId is required for direct calls' },
        { status: 400 }
      );
    }

    if (type === 'group' && (!participantIds || participantIds.length === 0)) {
      return NextResponse.json(
        { error: 'participantIds is required for group calls' },
        { status: 400 }
      );
    }

    if (type === 'sip' && !sipPhoneNumber) {
      return NextResponse.json(
        { error: 'sipPhoneNumber is required for SIP calls' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Check if user has sufficient balance for call
    const balanceCheck = await checkCallBalance(userId);
    if (!balanceCheck.canAfford) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          balance: balanceCheck.balance,
          estimatedCost: balanceCheck.estimatedCost,
          message: `You need at least ${balanceCheck.estimatedCost} stars for a 30-minute call. Your balance: ${balanceCheck.balance} stars`,
        },
        { status: 402 } // Payment Required
      );
    }

    // Create room name
    const roomName = type === 'direct' 
      ? `call-${userId}-${receiverId}`
      : type === 'group'
      ? `group-call-${userId}-${Date.now()}`
      : `sip-call-${userId}-${Date.now()}`;

    // Create 100ms room
    const room = await createRoom({
      name: roomName,
      description: `${type} call`,
      template_id: process.env.HMS_TEMPLATE_ID, // Optional template ID
      metadata: {
        hostId: userId,
        type,
        receiverId,
        participantIds,
        sipPhoneNumber,
      },
    });

    // Prepare participant list
    const allParticipants = type === 'direct'
      ? [userId, receiverId]
      : type === 'group'
      ? [userId, ...participantIds]
      : [userId];

    // Create call record in Firestore
    const callRef = doc(firestore, COLLECTIONS.CALLS);
    const callData: Partial<FirestoreCall> = {
      id: callRef.id,
      roomId: room.id,
      hostId: userId,
      participantIds: allParticipants,
      type: type as FirestoreCall['type'],
      callerId: userId,
      receiverId: type === 'direct' ? receiverId : undefined,
      sipEnabled: type === 'sip',
      sipPhoneNumber: type === 'sip' ? sipPhoneNumber : undefined,
      status: 'initiated',
      ratePerMinute: DEFAULT_RATE_PER_MINUTE_STARS,
      paymentStatus: 'pending',
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(callRef, callData);

    console.log(`✅ Call initiated: ${callRef.id} (room: ${room.id}, type: ${type}, host: ${userId})`);

    return NextResponse.json(
      {
        success: true,
        call: {
          id: callRef.id,
          roomId: room.id,
          type,
          status: 'initiated',
        },
        room: {
          id: room.id,
          name: room.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error initiating call:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to initiate call',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
