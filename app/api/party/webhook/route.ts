import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import type { FirestoreLiveParty, FirestoreTip, FirestorePayment } from '@/lib/firestore-collections';
import { createInvoice } from '@/lib/ghlPayments';

/**
 * Party Webhook Payload
 */
interface PartyWebhookPayload {
  event?: string;
  type?: string;
  room?: {
    id: string;
    name?: string;
    [key: string]: unknown;
  };
  data?: {
    room?: {
      id: string;
      name?: string;
      [key: string]: unknown;
    };
    userId?: string;
    amount?: number;
    tipAmount?: number;
    battleScore?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * POST /api/party/webhook
 * 
 * Handle party webhook events (joins, tips, battle scores)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let payload: PartyWebhookPayload;

    try {
      payload = JSON.parse(body);
    } catch {
      console.error('❌ Failed to parse webhook payload');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const eventType = payload.event || payload.type || 'unknown';
    const room = payload.room || payload.data?.room;
    const data = payload.data || {};

    if (!room || !room.id) {
      console.warn('⚠️ Webhook missing room data');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const firestore = getFirestoreInstance();
    const roomId = room.id;

    // Find livestream by roomId (check both roomId field and metadata)
    const livestreamsCollection = collection(firestore, COLLECTIONS.LIVESTREAMS);
    let livestreamQuery = query(livestreamsCollection, where('roomId', '==', roomId));
    let livestreamSnap = await getDocs(livestreamQuery);
    
    // If not found by roomId, try searching by metadata
    if (livestreamSnap.empty) {
      // Get all livestreams and check metadata (less efficient but works)
      const allLivestreams = await getDocs(livestreamsCollection);
      const matching = allLivestreams.docs.find(doc => {
        const data = doc.data();
        return data.metadata?.roomId === roomId || data.roomId === roomId;
      });
      if (matching) {
        livestreamSnap = { docs: [matching], empty: false } as any;
      }
    }

    if (livestreamSnap.empty) {
      console.warn(`⚠️ No livestream found for room: ${roomId}`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const livestreamDoc = livestreamSnap.docs[0];
    const livestreamData = livestreamDoc.data() as FirestoreLiveParty;

    // Handle participant join
    if (eventType === 'participant.joined' || eventType === 'participant_joined') {
      const userId = data.userId as string;
      if (userId && !livestreamData.viewers.includes(userId)) {
        const updatedViewers = [...livestreamData.viewers, userId];
        await updateDoc(livestreamDoc.ref, {
          viewers: updatedViewers,
          updatedAt: serverTimestamp() as Timestamp,
        });
        console.log(`✅ User ${userId} joined party ${livestreamDoc.id}`);
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle participant left
    if (eventType === 'participant.left' || eventType === 'participant_left') {
      const userId = data.userId as string;
      if (userId && livestreamData.viewers.includes(userId)) {
        const updatedViewers = livestreamData.viewers.filter((id) => id !== userId);
        
        // Calculate viewer minutes
        const viewerMinutes = { ...livestreamData.viewerMinutes };
        const joinedAt = data.joinedAt ? new Date(data.joinedAt as string).getTime() : Date.now();
        const leftAt = Date.now();
        const minutesWatched = Math.floor((leftAt - joinedAt) / 60000);
        viewerMinutes[userId] = (viewerMinutes[userId] || 0) + minutesWatched;

        // Calculate viewer fee if applicable
        let viewerRevenue = 0;
        if (livestreamData.viewerFeePerMinute && livestreamData.viewerFeePerMinute > 0) {
          viewerRevenue = minutesWatched * livestreamData.viewerFeePerMinute;
        }

        await updateDoc(livestreamDoc.ref, {
          viewers: updatedViewers,
          viewerMinutes,
          totalViewerRevenue: (livestreamData.totalViewerRevenue || 0) + viewerRevenue,
          updatedAt: serverTimestamp() as Timestamp,
        });
        console.log(`✅ User ${userId} left party ${livestreamDoc.id} (watched: ${minutesWatched} min)`);
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle tip
    if (eventType === 'tip' || eventType === 'tip_received') {
      const userId = data.userId as string;
      const tipAmount = (data.tipAmount || data.amount) as number;

      if (!userId || !tipAmount || tipAmount <= 0) {
        console.warn('⚠️ Invalid tip data');
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Create tip record
      const tipsCollection = collection(firestore, COLLECTIONS.TIPS);
      const tipRef = doc(tipsCollection);
      await setDoc(tipRef, {
        id: tipRef.id,
        livestreamId: livestreamDoc.id,
        hostId: livestreamData.hostId,
        tipperId: userId,
        amount: tipAmount,
        currency: 'STARS',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      });

      // Update livestream totals
      await updateDoc(livestreamDoc.ref, {
        totalTips: (livestreamData.totalTips || 0) + tipAmount,
        updatedAt: serverTimestamp() as Timestamp,
      });

      console.log(`✅ Tip received: ${tipAmount} stars from ${userId} to party ${livestreamDoc.id}`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle battle score
    if (eventType === 'battle.score' || eventType === 'battle_score') {
      const battleScore = data.battleScore as number;
      const hostId = data.hostId as string;

      if (battleScore !== undefined && hostId) {
        await updateDoc(livestreamDoc.ref, {
          metadata: {
            ...livestreamData.metadata,
            battleScores: {
              ...((livestreamData.metadata?.battleScores as Record<string, number>) || {}),
              [hostId]: battleScore,
            },
          },
          updatedAt: serverTimestamp() as Timestamp,
        });
        console.log(`✅ Battle score updated: ${hostId} = ${battleScore} in party ${livestreamDoc.id}`);
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle room end
    if (eventType === 'room.end' || eventType === 'room_ended') {
      const startedAt = livestreamData.startedAt?.toMillis() || Date.now();
      const endedAt = Date.now();
      const durationSeconds = Math.floor((endedAt - startedAt) / 1000);

      await updateDoc(livestreamDoc.ref, {
        status: 'ended',
        endedAt: serverTimestamp() as Timestamp,
        duration: durationSeconds,
        updatedAt: serverTimestamp() as Timestamp,
      });

      console.log(`✅ Party ${livestreamDoc.id} ended (duration: ${durationSeconds}s)`);

      // Create payment for entry fees if applicable
      if (livestreamData.totalEntryRevenue > 0 && livestreamData.hostId) {
        try {
          const paymentCurrency = livestreamData.entryFeeCurrency || 'USD';
          const useWallet = paymentCurrency === 'STARS';
          
          if (useWallet) {
            // For STARS, we don't need to create a payment - revenue is already in stars
            console.log(`✅ Party ${livestreamDoc.id} entry revenue: ${livestreamData.totalEntryRevenue} stars`);
          } else {
            // Create GHL invoice for USD payments
            await createPartyPayment(livestreamData.hostId, livestreamDoc.id, livestreamData.totalEntryRevenue);
          }
        } catch (paymentError) {
          console.error(`❌ Error processing payment for party ${livestreamDoc.id}:`, paymentError);
        }
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Unknown event type
    console.log(`ℹ️ Unknown webhook event: ${eventType} for room: ${roomId}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing party webhook:', error);
    // Always return 200 OK to prevent retries
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

/**
 * Helper function to create GHL payment for party entry fees
 */
async function createPartyPayment(
  userId: string,
  livestreamId: string,
  totalRevenue: number
): Promise<void> {
  const firestore = getFirestoreInstance();
  
  try {
    // Get user to find GHL contact ID
    const userRef = doc(firestore, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error(`❌ User not found: ${userId}`);
      return;
    }
    
    const userData = userSnap.data();
    const ghlContactId = userData.ghlId || userData.ghlContactId;
    const ghlLocationId = userData.ghlLocationId;
    
    if (!ghlContactId || !ghlLocationId) {
      console.error(`❌ GHL contact ID or location ID not found for user: ${userId}`);
      return;
    }
    
    // Convert revenue from cents to dollars
    const amountInDollars = totalRevenue / 100;
    
    // Create GHL invoice
    const invoiceResponse = await createInvoice(
      {
        contactId: ghlContactId,
        items: [
          {
            name: `Party ${livestreamId} Entry Fees`,
            quantity: 1,
            price: amountInDollars,
            description: `Total entry fees collected from party`,
          },
        ],
        notes: `Party ${livestreamId} entry fees`,
        metadata: {
          livestreamId,
          type: 'liveparty_entry',
        },
      },
      ghlLocationId
    );
    
    // Create payment record
    const paymentRef = doc(firestore, COLLECTIONS.PAYMENTS);
    const paymentData: Partial<FirestorePayment> = {
      id: paymentRef.id,
      userId,
      amount: amountInDollars,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'ghl',
      ghlTransactionId: invoiceResponse.invoice.id,
      ghlContactId,
      ghlLocationId,
      description: `Party ${livestreamId} entry fees`,
      metadata: {
        ghlInvoiceData: invoiceResponse.invoice,
        livestreamId,
        type: 'liveparty_entry',
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    await setDoc(paymentRef, paymentData);
    
    console.log(`✅ GHL invoice created for party ${livestreamId}: ${invoiceResponse.invoice.id}`);
  } catch (error) {
    console.error(`❌ Error creating GHL payment for party ${livestreamId}:`, error);
    throw error;
  }
}

