import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, createInvoice } from '@/lib/ghlPayments';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FirestorePayment, FirestoreMessage } from '@/lib/firestore-collections';

/**
 * POST /api/payments/create
 * 
 * Create a payment order or invoice in GoHighLevel
 * 
 * For locked messages:
 * Body:
 * {
 *   userId: string;
 *   messageId: string;
 *   chatId: string;
 * }
 * 
 * For general payments:
 * Body:
 * {
 *   userId: string;
 *   contactId?: string; // GHL contact ID (optional, will use user's ghlId)
 *   amount: number;
 *   currency?: string;
 *   description?: string;
 *   paymentMethod?: string;
 *   items?: Array<{name, quantity, price, description?}>;
 *   locationId?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      messageId,
      chatId,
      // General payment fields
      contactId,
      amount,
      currency = 'USD',
      description,
      paymentMethod,
      items,
      locationId,
    } = body;

    const firestore = getFirestoreInstance();

    // Handle locked message payment
    if (messageId && chatId) {
      if (!userId) {
        return NextResponse.json(
          { error: 'Missing required field: userId' },
          { status: 400 }
        );
      }

      // Get message from Firestore
      const messagesPath = `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`;
      const messageRef = doc(firestore, messagesPath, messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 }
        );
      }

      const messageData = messageSnap.data() as FirestoreMessage;

      // Check if message is locked
      if (!messageData.isLocked || !messageData.unlockPrice) {
        return NextResponse.json(
          { error: 'Message is not locked or does not have an unlock price' },
          { status: 400 }
        );
      }

      // Check if user has already unlocked this message
      // Support both array and map structures
      const unlockedBy = messageData.unlockedBy;
      if (unlockedBy) {
        const isAlreadyUnlocked = Array.isArray(unlockedBy) 
          ? unlockedBy.includes(userId)
          : (unlockedBy as Record<string, unknown>)[userId] != null;
        
        if (isAlreadyUnlocked) {
          return NextResponse.json(
            { error: 'Message already unlocked by this user' },
            { status: 400 }
          );
        }
      }

      // Get user from Firestore
      const userRef = doc(firestore, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userSnap.data();
      const ghlContactId = contactId || userData.ghlId || userData.ghlContactId;
      const ghlLocationId = locationId || userData.ghlLocationId;

      if (!ghlContactId) {
        return NextResponse.json(
          { error: 'GHL contact ID not found. User must have ghlId or ghlContactId.' },
          { status: 400 }
        );
      }

      if (!ghlLocationId) {
        return NextResponse.json(
          { error: 'GHL location ID not found. Provide locationId or set user.ghlLocationId.' },
          { status: 400 }
        );
      }

      // Convert unlockPrice from cents to dollars
      const unlockAmount = messageData.unlockPrice / 100;
      const unlockCurrency = messageData.unlockCurrency || 'USD';

      // Create invoice in GHL
      const invoiceResponse = await createInvoice(
        {
          contactId: ghlContactId,
          items: [
            {
              name: `Unlock message ${messageId}`,
              quantity: 1,
              price: unlockAmount,
              description: `Unlock locked message from ${messageData.senderName}`,
            },
          ],
          notes: `Payment to unlock message ${messageId} in chat ${chatId}`,
          metadata: {
            messageId,
            chatId,
            userId,
            type: 'message_unlock',
          },
        },
        ghlLocationId
      );

      const ghlInvoice = invoiceResponse.invoice;

      // Update message with ghlInvoiceId
      await updateDoc(messageRef, {
        ghlInvoiceId: ghlInvoice.id,
        updatedAt: serverTimestamp(),
      });

      // Create payment record in Firestore
      const paymentRef = doc(firestore, COLLECTIONS.PAYMENTS);
      const paymentData: Partial<FirestorePayment> = {
        id: paymentRef.id,
        userId,
        chatId,
        messageId,
        amount: unlockAmount,
        currency: unlockCurrency,
        status: 'pending',
        paymentMethod: 'ghl',
        ghlTransactionId: ghlInvoice.id,
        ghlContactId,
        ghlLocationId,
        description: `Unlock message ${messageId}`,
        metadata: {
          ghlInvoiceData: ghlInvoice,
          type: 'message_unlock',
        },
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(paymentRef, paymentData);

      console.log(`✅ Created invoice for locked message: ${messageId}, invoice: ${ghlInvoice.id} for user: ${userId}`);

      return NextResponse.json(
        {
          success: true,
          invoice: {
            id: paymentRef.id,
            ghlInvoiceId: ghlInvoice.id,
            status: 'pending',
            amount: unlockAmount,
            currency: unlockCurrency,
          },
          messageId,
        },
        { status: 201 }
      );
    }

    // Handle general payment order
    // Validate required fields
    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount' },
        { status: 400 }
      );
    }

    // Get user from Firestore
    const userRef = doc(firestore, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const ghlContactId = contactId || userData.ghlId || userData.ghlContactId;
    const ghlLocationId = locationId || userData.ghlLocationId;

    if (!ghlContactId) {
      return NextResponse.json(
        { error: 'GHL contact ID not found. User must have ghlId or ghlContactId.' },
        { status: 400 }
      );
    }

    if (!ghlLocationId) {
      return NextResponse.json(
        { error: 'GHL location ID not found. Provide locationId or set user.ghlLocationId.' },
        { status: 400 }
      );
    }

    // Create payment order in GHL
    const paymentOrder = await createPaymentOrder(
      {
        contactId: ghlContactId,
        amount,
        currency,
        description: description || `Payment for ${userData.displayName}`,
        paymentMethod,
        items,
      },
      ghlLocationId
    );

    const ghlPayment = paymentOrder.payment;

    // Create payment record in Firestore
    const paymentRef = doc(firestore, COLLECTIONS.PAYMENTS);
    const paymentData: Partial<FirestorePayment> = {
      id: paymentRef.id,
      userId,
      amount,
      currency,
      status: mapGHLPaymentStatus(ghlPayment.status),
      paymentMethod: 'ghl',
      paymentMethodId: ghlPayment.paymentMethod,
      ghlTransactionId: ghlPayment.id,
      ghlContactId,
      ghlLocationId,
      description: ghlPayment.description || description,
      metadata: {
        ghlPaymentData: ghlPayment,
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(paymentRef, paymentData);

    console.log(`✅ Created payment order: ${ghlPayment.id} for user: ${userId}`);

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: paymentRef.id,
          ghlPaymentId: ghlPayment.id,
          status: paymentData.status,
          amount,
          currency,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create payment',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Map GHL payment status to our payment status
 */
function mapGHLPaymentStatus(ghlStatus: string): FirestorePayment['status'] {
  const statusMap: Record<string, FirestorePayment['status']> = {
    'pending': 'pending',
    'processing': 'processing',
    'completed': 'completed',
    'success': 'completed',
    'paid': 'completed',
    'failed': 'failed',
    'error': 'failed',
    'refunded': 'refunded',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
  };

  return statusMap[ghlStatus?.toLowerCase()] || 'pending';
}

