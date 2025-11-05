import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/hms-client';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestoreLiveParty } from '@/lib/firestore-collections';
import { getAuthenticatedUserId } from '@/lib/auth-server';

/**
 * POST /api/party/initiate
 * 
 * Create a group_live room for a live party
 * 
 * Body:
 * {
 *   entryFee?: number; // Entry fee in cents (USD) or stars
 *   entryFeeCurrency?: 'USD' | 'STARS'; // Default: 'STARS'
 *   viewerFeePerMinute?: number; // Optional per-minute viewer fee
 *   viewerFeeCurrency?: 'USD' | 'STARS';
 *   scheduledAt?: string; // ISO timestamp for scheduled parties
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
    const {
      entryFee = 0,
      entryFeeCurrency = 'STARS',
      viewerFeePerMinute,
      viewerFeeCurrency = 'STARS',
      scheduledAt,
    } = body;

    const firestore = getFirestoreInstance();

    // Create room name
    const roomName = `liveparty-${userId}-${Date.now()}`;

    // Create 100ms room with group_live template
    const room = await createRoom({
      name: roomName,
      description: 'Live party room',
      template_id: process.env.HMS_GROUP_LIVE_TEMPLATE_ID || 'group_live',
      metadata: {
        hostId: userId,
        type: 'liveparty',
        entryFee,
        entryFeeCurrency,
        viewerFeePerMinute,
        viewerFeeCurrency,
      },
    });

    // Create livestream record in Firestore
    const livestreamRef = doc(firestore, COLLECTIONS.LIVESTREAMS);
    const livestreamData: Partial<FirestoreLiveParty> = {
      id: livestreamRef.id,
      hostId: userId,
      roomId: room.id, // Store roomId
      status: scheduledAt ? 'scheduled' : 'live',
      entryFee,
      entryFeeCurrency: entryFeeCurrency as 'USD' | 'STARS',
      viewerFeePerMinute,
      viewerFeeCurrency: viewerFeeCurrency as 'USD' | 'STARS',
      totalEntryRevenue: 0,
      totalViewerRevenue: 0,
      totalTips: 0,
      viewers: [],
      viewerMinutes: {},
      scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : undefined,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(livestreamRef, livestreamData);

    // If scheduled, don't start yet
    if (!scheduledAt) {
      await setDoc(livestreamRef, {
        startedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      }, { merge: true });
    }

    console.log(`✅ Live party initiated: ${livestreamRef.id} (room: ${room.id}, host: ${userId})`);

    return NextResponse.json(
      {
        success: true,
        party: {
          id: livestreamRef.id,
          roomId: room.id,
          hostId: userId,
          status: scheduledAt ? 'scheduled' : 'live',
          entryFee,
          entryFeeCurrency,
        },
        room: {
          id: room.id,
          name: room.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error initiating live party:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to initiate live party',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

