import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import type { FirestoreCall, FirestorePayment } from '@/lib/firestore-collections';
import { createInvoice } from '@/lib/ghlPayments';

/**
 * HMS Webhook Payload
 */
interface HMSWebhookPayload {
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
    duration?: number;
    started_at?: string;
    ended_at?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * POST /api/call/webhook
 * 
 * Handle 100ms webhook events (room.start, room.end)
 * Computes duration & cost, creates payment if needed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let payload: HMSWebhookPayload;

    try {
      payload = JSON.parse(body);
    } catch {
      console.error('❌ Failed to parse webhook payload');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const eventType = payload.event || payload.type || 'unknown';
    const room = payload.room || payload.data?.room;

    if (!room || !room.id) {
      console.warn('⚠️ Webhook missing room data');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const firestore = getFirestoreInstance();
    const roomId = room.id;

    // Find call by roomId
    const callsRef = doc(firestore, COLLECTIONS.CALLS);
    const callsQuery = await import('firebase/firestore');
    const { query, where, getDocs, collection } = callsQuery;
    const callsCollection = collection(firestore, COLLECTIONS.CALLS);
    const callQuery = query(callsCollection, where('roomId', '==', roomId));
    const callSnap = await getDocs(callQuery);

    if (callSnap.empty) {
      console.warn(`⚠️ No call found for room: ${roomId}`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const callDoc = callSnap.docs[0];
    const callData = callDoc.data() as FirestoreCall;

    // Handle room.start event
    if (eventType === 'room.start' || eventType === 'room_started') {
      await updateDoc(callDoc.ref, {
        status: 'active',
        startedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      });

      console.log(`✅ Call ${callDoc.id} started (room: ${roomId})`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle room.end event
    if (eventType === 'room.end' || eventType === 'room_ended') {
      const startedAt = callData.startedAt?.toMillis() || Date.now();
      const endedAt = Date.now();
      const durationSeconds = Math.floor((endedAt - startedAt) / 1000);
      const durationMinutes = durationSeconds / 60;

      // Calculate cost (if rate is set)
      let cost = 0;
      const ratePerMinute = callData.ratePerMinute || 0;
      if (ratePerMinute > 0) {
        cost = Math.ceil(durationMinutes * ratePerMinute);
      }

      // Update call record
      await updateDoc(callDoc.ref, {
        status: 'ended',
        endedAt: serverTimestamp() as Timestamp,
        duration: durationSeconds,
        cost,
        totalCost: cost,
        costCurrency: callData.costCurrency || 'USD',
        updatedAt: serverTimestamp() as Timestamp,
      });

      console.log(`✅ Call ${callDoc.id} ended (duration: ${durationSeconds}s, cost: ${cost} cents)`);

      // Create payment if cost > 0
      if (cost > 0 && callData.hostId) {
        try {
          const paymentCurrency = callData.costCurrency || 'USD';
          const useWallet = paymentCurrency === 'STARS';
          
          if (useWallet) {
            // Deduct from wallet
            const { spendStars } = await import('@/lib/wallet');
            const result = await spendStars(callData.hostId, cost, `Call ${callDoc.id} - ${durationMinutes.toFixed(2)} minutes`);
            
            if (result.success) {
              await updateDoc(callDoc.ref, {
                paymentStatus: 'paid',
                updatedAt: serverTimestamp() as Timestamp,
              });
              console.log(`✅ Wallet deduction successful for call ${callDoc.id}: ${cost} stars`);
            } else {
              // If wallet deduction fails, create GHL invoice
              await createGHLPayment(callData.hostId, cost, callDoc.id, durationSeconds, durationMinutes);
            }
          } else {
            // Create GHL invoice for USD payments
            await createGHLPayment(callData.hostId, cost, callDoc.id, durationSeconds, durationMinutes);
          }
        } catch (paymentError) {
          console.error(`❌ Error processing payment for call ${callDoc.id}:`, paymentError);
        }
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Unknown event type
    console.log(`ℹ️ Unknown webhook event: ${eventType} for room: ${roomId}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing call webhook:', error);
    // Always return 200 OK to prevent retries
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

/**
 * Helper function to create GHL payment for call
 */
async function createGHLPayment(
  userId: string,
  cost: number,
  callId: string,
  durationSeconds: number,
  durationMinutes: number
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
    
    // Convert cost from cents to dollars
    const amountInDollars = cost / 100;
    
    // Create GHL invoice
    const invoiceResponse = await createInvoice(
      {
        contactId: ghlContactId,
        items: [
          {
            name: `Call ${callId}`,
            quantity: 1,
            price: amountInDollars,
            description: `Call duration: ${durationMinutes.toFixed(2)} minutes`,
          },
        ],
        notes: `Call ${callId} - ${durationMinutes.toFixed(2)} minutes`,
        metadata: {
          callId,
          duration: durationSeconds,
          type: 'call',
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
      description: `Call ${callId} - ${durationMinutes.toFixed(2)} minutes`,
      metadata: {
        ghlInvoiceData: invoiceResponse.invoice,
        callId,
        duration: durationSeconds,
        type: 'call',
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    await setDoc(paymentRef, paymentData);
    
    // Update call with payment info
    const callRef = doc(firestore, COLLECTIONS.CALLS, callId);
    await updateDoc(callRef, {
      transactionId: paymentRef.id,
      paymentStatus: 'pending',
      updatedAt: serverTimestamp() as Timestamp,
    });
    
    console.log(`✅ GHL invoice created for call ${callId}: ${invoiceResponse.invoice.id}`);
  } catch (error) {
    console.error(`❌ Error creating GHL payment for call ${callId}:`, error);
    throw error;
  }
}
