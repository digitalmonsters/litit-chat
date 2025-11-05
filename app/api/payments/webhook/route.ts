import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, query, where, getDocs, updateDoc, serverTimestamp, collection, Timestamp, getDoc } from 'firebase/firestore';
import type { FirestorePayment, FirestoreUser, FirestoreMessage } from '@/lib/firestore-collections';
import { convertUsdToStars, getOrCreateWallet, addStars } from '@/lib/wallet';
import { STAR_CONVERSION_RATE } from '@/lib/wallet';
import { completeTransaction } from '@/lib/transactions';

/**
 * GHL Payment Webhook Payload
 */
interface GHLPaymentWebhookPayload {
  event?: string;
  type?: string;
  payment?: {
    id: string;
    contactId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  };
  invoice?: {
    id: string;
    contactId: string;
    amount: number;
    currency: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  };
  subscription?: {
    id: string;
    contactId: string;
    planName?: string;
    amount: number;
    currency: string;
    status: string;
    interval?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  };
  data?: {
    payment?: {
      id: string;
      contactId: string;
      amount: number;
      currency: string;
      status: string;
      [key: string]: unknown;
    };
    invoice?: {
      id: string;
      contactId: string;
      amount: number;
      currency: string;
      status: string;
      [key: string]: unknown;
    };
    subscription?: {
      id: string;
      contactId: string;
      planName?: string;
      amount: number;
      currency: string;
      status: string;
      interval?: string;
      [key: string]: unknown;
    };
  };
}

/**
 * POST /api/payments/webhook
 * 
 * Handle payment webhooks from GoHighLevel
 * Updates Firestore transactions and user tier on success
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let payload: GHLPaymentWebhookPayload;

    try {
      payload = JSON.parse(body);
    } catch {
      console.error('❌ Failed to parse webhook payload');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const eventType = payload.event || payload.type || 'unknown';
    const payment = payload.payment || payload.data?.payment;
    const invoice = payload.invoice || payload.data?.invoice;
    const subscription = payload.subscription || payload.data?.subscription;

    // Handle InvoicePaid events
    if (eventType === 'InvoicePaid' || eventType === 'invoice.paid' || eventType === 'Invoice.paid') {
      if (!invoice) {
        console.warn('⚠️ InvoicePaid webhook missing invoice data');
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      await handleInvoicePaid(invoice);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle InvoiceFailed events
    if (eventType === 'InvoiceFailed' || eventType === 'invoice.failed' || eventType === 'Invoice.failed') {
      if (!invoice) {
        console.warn('⚠️ InvoiceFailed webhook missing invoice data');
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      await handleInvoiceFailed(invoice);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle SubscriptionCancelled events
    if (eventType === 'SubscriptionCancelled' || eventType === 'subscription.cancelled' || eventType === 'Subscription.cancelled') {
      if (!subscription) {
        console.warn('⚠️ SubscriptionCancelled webhook missing subscription data');
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      await handleSubscriptionCancelled(subscription);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle regular payment webhooks
    if (!payment) {
      console.warn('⚠️ Payment webhook missing payment data');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    console.log(`✅ Received payment webhook: ${eventType} for payment: ${payment.id}`);

    const firestore = getFirestoreInstance();
    const paymentStatus = mapGHLPaymentStatus(payment.status);

    // Find payment in Firestore by GHL transaction ID
    const paymentsRef = collection(firestore, COLLECTIONS.PAYMENTS);
    const paymentQuery = query(
      paymentsRef,
      where('ghlTransactionId', '==', payment.id)
    );
    const paymentSnap = await getDocs(paymentQuery);

    let paymentRef;
    let paymentData: Partial<FirestorePayment>;

    if (!paymentSnap.empty) {
      // Update existing payment
      paymentRef = paymentSnap.docs[0].ref;
      paymentData = {
        status: paymentStatus,
        amount: payment.amount,
        currency: payment.currency,
        updatedAt: serverTimestamp() as Timestamp,
        metadata: {
          ...paymentSnap.docs[0].data().metadata,
          ghlPaymentData: payment,
        },
      };

      if (paymentStatus === 'completed') {
        paymentData.completedAt = serverTimestamp() as Timestamp;
      } else if (paymentStatus === 'failed') {
        paymentData.failedAt = serverTimestamp() as Timestamp;
      }

      await updateDoc(paymentRef, paymentData);
      console.log(`✅ Updated payment: ${paymentRef.id}`);
    } else {
      // Create new payment record
      paymentRef = doc(firestore, COLLECTIONS.PAYMENTS);
      paymentData = {
        id: paymentRef.id,
        userId: '', // Will be set when we find user
        amount: payment.amount,
        currency: payment.currency,
        status: paymentStatus,
        paymentMethod: 'ghl',
        ghlTransactionId: payment.id,
        ghlContactId: payment.contactId,
        description: `Payment from GHL: ${payment.id}`,
        metadata: {
          ghlPaymentData: payment,
        },
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      if (paymentStatus === 'completed') {
        paymentData.completedAt = serverTimestamp() as Timestamp;
      }

      await setDoc(paymentRef, paymentData);
      console.log(`✅ Created payment record: ${paymentRef.id}`);
    }

    // Find user by GHL contact ID
    const usersCollection = collection(firestore, COLLECTIONS.USERS);
    const usersQueryGhlId = query(
      usersCollection,
      where('ghlId', '==', payment.contactId)
    );
    const usersByGhlId = await getDocs(usersQueryGhlId);

    // Also check ghlContactId for backward compatibility
    const usersQueryGhlContactId = query(
      usersCollection,
      where('ghlContactId', '==', payment.contactId)
    );
    const usersByGhlContactId = await getDocs(usersQueryGhlContactId);

    const userDocs = [...usersByGhlId.docs, ...usersByGhlContactId.docs];
    const uniqueUsers = new Map();
    userDocs.forEach(doc => uniqueUsers.set(doc.id, doc));

    // Update user tier on payment success
    if (paymentStatus === 'completed' && uniqueUsers.size > 0) {
      const tier = determineTierFromAmount(payment.amount);

      for (const userDoc of uniqueUsers.values()) {
        const userData = userDoc.data() as FirestoreUser;
        const userId = userDoc.id;
        const currentTier = userData.tier || 'free';

        // Only upgrade tier, don't downgrade
        if (shouldUpgradeTier(currentTier, tier)) {
          await updateDoc(userDoc.ref, {
            tier,
            updatedAt: serverTimestamp() as Timestamp,
          });

          // Sync ghlId if not already set
          if (!userData.ghlId && payment.contactId) {
            await updateDoc(userDoc.ref, {
              ghlId: payment.contactId,
              ghlContactId: payment.contactId, // Keep both for compatibility
              updatedAt: serverTimestamp() as Timestamp,
            });
          }

          console.log(`✅ Updated user tier: ${userId} → ${tier}`);
        }

        // Convert USD to stars (optional - check if user wants conversion)
        // For now, we'll convert automatically. Can be made configurable later.
        try {
          const paymentDataSnap = await getDoc(paymentRef);
          if (paymentDataSnap.exists()) {
            const paymentData = paymentDataSnap.data() as FirestorePayment;
            
            // Check if payment metadata indicates auto-convert to stars
            const autoConvert = paymentData.metadata?.autoConvertToStars !== false; // Default to true
            
            if (autoConvert && payment.amount > 0) {
              const result = await convertUsdToStars(userId, payment.amount);
              if (result.success) {
                console.log(`✅ Converted ${payment.amount} cents to ${result.starsAdded} stars for user: ${userId}`);
              }
            }

            // Unlock message if this payment was for a locked message
            if (paymentData.messageId && paymentData.chatId) {
              const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
              const { getFirestoreInstance, COLLECTIONS } = await import('@/lib/firebase');
              const db = getFirestoreInstance();
              const messageRef = doc(
                db,
                `${COLLECTIONS.CHATS}/${paymentData.chatId}/${COLLECTIONS.MESSAGES}`,
                paymentData.messageId
              );
              await updateDoc(messageRef, {
                isLocked: false,
                paymentId: paymentData.id,
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch (error) {
          console.error(`❌ Error processing wallet/conversion for user ${userId}:`, error);
          // Don't fail the webhook if conversion fails
        }
      }

      // Update payment userId if we found a user
      if (uniqueUsers.size === 1) {
        const userId = Array.from(uniqueUsers.keys())[0];
        const paymentDataSnap = await getDoc(paymentRef);
        const currentPaymentData = paymentDataSnap.exists() 
          ? paymentDataSnap.data() as FirestorePayment 
          : null;

        await updateDoc(paymentRef, {
          userId,
          updatedAt: serverTimestamp() as Timestamp,
        });

        // Sync payment to transaction if transactionId exists in metadata
        if (currentPaymentData?.metadata?.transactionId && paymentStatus === 'completed') {
          try {
            await completeTransaction(
              currentPaymentData.metadata.transactionId as string,
              paymentRef.id,
              payment.id
            );
            console.log(`✅ Synced payment to transaction: ${currentPaymentData.metadata.transactionId}`);
          } catch (error) {
            console.error(`❌ Error syncing payment to transaction:`, error);
          }
        }
      }
    }

    // Sync ghlId if payment was successful but user not found
    if (paymentStatus === 'completed' && uniqueUsers.size === 0 && payment.contactId) {
      console.log(`ℹ️ Payment completed but no user found for contact: ${payment.contactId}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing payment webhook:', error);
    // Always return 200 OK to prevent retries
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

/**
 * Map GHL payment status to Firestore payment status
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

/**
 * Determine tier based on payment amount
 */
function determineTierFromAmount(amount: number): FirestoreUser['tier'] {
  if (amount >= 100) return 'enterprise';
  if (amount >= 50) return 'premium';
  if (amount >= 20) return 'basic';
  return 'free';
}

/**
 * Check if tier should be upgraded
 */
function shouldUpgradeTier(currentTier: FirestoreUser['tier'], newTier: FirestoreUser['tier']): boolean {
  const tierOrder: Record<string, number> = { 
    free: 0, 
    basic: 1, 
    premium: 2, 
    enterprise: 3,
    litplus: 2, // Same level as premium
  };
  const currentLevel = tierOrder[currentTier || 'free'] ?? 0;
  const newLevel = tierOrder[newTier || 'free'] ?? 0;
  return newLevel > currentLevel;
}

/**
 * Unlock a message for a user
 */
async function unlockMessageForUser(
  messageId: string,
  chatId: string,
  userId: string
): Promise<void> {
  const firestore = getFirestoreInstance();
  const messagesPath = `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`;
  const messageRef = doc(firestore, messagesPath, messageId);
  const messageSnap = await getDoc(messageRef);

  if (!messageSnap.exists()) {
    console.warn(`⚠️ Message not found: ${messageId}`);
    return;
  }

  const messageData = messageSnap.data() as FirestoreMessage;
  const unlockedBy: string[] = Array.isArray(messageData.unlockedBy) 
    ? messageData.unlockedBy 
    : [];

  if (!unlockedBy.includes(userId)) {
    await updateDoc(messageRef, {
      unlockedBy: [...unlockedBy, userId],
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Unlocked message ${messageId} for user ${userId}`);
  }
}

/**
 * Handle InvoicePaid event for locked messages
 */
async function handleInvoicePaid(invoice: {
  id: string;
  contactId: string;
  amount: number;
  currency: string;
  status: string;
  [key: string]: unknown;
}): Promise<void> {
  const firestore = getFirestoreInstance();

  try {
    // Find payment record by ghlTransactionId (invoice ID)
    const paymentsRef = collection(firestore, COLLECTIONS.PAYMENTS);
    const paymentQuery = query(
      paymentsRef,
      where('ghlTransactionId', '==', invoice.id)
    );
    const paymentSnap = await getDocs(paymentQuery);

    if (paymentSnap.empty) {
      console.warn(`⚠️ InvoicePaid webhook: No payment record found for invoice: ${invoice.id}`);
      return;
    }

    const paymentDoc = paymentSnap.docs[0];
    const paymentData = paymentDoc.data() as FirestorePayment;

    // Check if this is a message unlock payment
    if (paymentData.messageId && paymentData.chatId && paymentData.userId) {
      const messagesPath = `${COLLECTIONS.CHATS}/${paymentData.chatId}/${COLLECTIONS.MESSAGES}`;
      const messageRef = doc(firestore, messagesPath, paymentData.messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        console.warn(`⚠️ InvoicePaid webhook: Message not found: ${paymentData.messageId}`);
      } else {
        const messageData = messageSnap.data() as FirestoreMessage;
        
        // Use map structure for better Firestore security rules support
        // Convert array to map if needed, or initialize as map
        let unlockedBy: Record<string, Timestamp>;
        
        if (Array.isArray(messageData.unlockedBy)) {
          // Convert array to map
          unlockedBy = {};
          (messageData.unlockedBy as string[]).forEach((uid: string) => {
            unlockedBy[uid] = serverTimestamp() as Timestamp;
          });
        } else {
          // Already a map or null/undefined
          unlockedBy = (messageData.unlockedBy as Record<string, Timestamp>) || {};
        }
        
        // Add buyer to unlockedBy map if not already present
        if (!unlockedBy[paymentData.userId]) {
          unlockedBy[paymentData.userId] = serverTimestamp() as Timestamp;

          await updateDoc(messageRef, {
            unlockedBy,
            updatedAt: serverTimestamp(),
          });

          console.log(`✅ Payment received – unlocked message ${paymentData.messageId} for user ${paymentData.userId}.`);
        } else {
          console.log(`ℹ️ Message ${paymentData.messageId} already unlocked by user ${paymentData.userId}`);
        }
      }
    }

    // Update payment status (always update, even if message was already unlocked)
    const paymentStatus = mapGHLPaymentStatus(invoice.status);
    await updateDoc(paymentDoc.ref, {
      status: paymentStatus,
      amount: invoice.amount,
      currency: invoice.currency,
      updatedAt: serverTimestamp() as Timestamp,
      metadata: {
        ...paymentData.metadata,
        ghlInvoiceData: invoice,
      },
    });

    if (paymentStatus === 'completed') {
      await updateDoc(paymentDoc.ref, {
        completedAt: serverTimestamp() as Timestamp,
      });

      // Sync payment to transaction if transactionId exists
      if (paymentData.metadata?.transactionId) {
        try {
          await completeTransaction(
            paymentData.metadata.transactionId as string,
            paymentDoc.id,
            invoice.id
          );
          console.log(`✅ Synced payment to transaction: ${paymentData.metadata.transactionId}`);
        } catch (error) {
          console.error(`❌ Error syncing payment to transaction:`, error);
        }
      }

      // Handle wallet topup payments - increment wallets.stars
      if (paymentData.metadata?.type === 'wallet_topup' && paymentData.userId) {
        // Get stars from metadata or calculate from amount
        let stars = paymentData.metadata.stars as number | undefined;
        
        // If no stars in metadata, calculate from amount (1 cent = 1 star)
        if (!stars && invoice.amount > 0) {
          stars = invoice.amount * STAR_CONVERSION_RATE;
        }
        
        if (stars && stars > 0) {
          const result = await addStars(paymentData.userId, stars, `Wallet top-up via invoice ${invoice.id}`);
          if (result.success) {
            console.log(`✅ Top-up: ${stars} stars added to wallet for user ${paymentData.userId}`);
          } else {
            console.error(`❌ Error adding stars to wallet: ${result.error}`);
          }
        }
      }

      // Handle subscription payments - update users.tier to 'litplus'
      const isSubscription = paymentData.metadata?.type === 'subscription' || 
                              paymentData.description?.toLowerCase().includes('subscription') ||
                              paymentData.description?.toLowerCase().includes('litplus') ||
                              invoice.planName ||
                              invoice.interval;
      
      if (isSubscription && paymentData.userId) {
        const userRef = doc(firestore, COLLECTIONS.USERS, paymentData.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data() as FirestoreUser;
          
          // Update tier to 'litplus' for subscription
          await updateDoc(userRef, {
            tier: 'litplus' as FirestoreUser['tier'],
            updatedAt: serverTimestamp(),
            metadata: {
              ...userData.metadata,
              subscriptionId: paymentData.ghlTransactionId || invoice.id,
              subscriptionPlan: paymentData.metadata?.plan || invoice.planName || 'litplus',
              subscriptionStatus: 'active',
              subscriptionStartedAt: serverTimestamp(),
            },
          });
          
          console.log(`✅ Subscription activated: User ${paymentData.userId} tier set to 'litplus'`);
        }
      }
    }

    console.log(`✅ Updated payment: ${paymentDoc.id} for invoice: ${invoice.id}`);
  } catch (error) {
    console.error(`❌ Error handling InvoicePaid event for invoice ${invoice.id}:`, error);
    throw error;
  }
}

/**
 * Handle InvoiceFailed event
 * Sets user tier to 'free' and sends reactivation link
 */
async function handleInvoiceFailed(invoice: {
  id: string;
  contactId: string;
  amount: number;
  currency: string;
  status: string;
  [key: string]: unknown;
}): Promise<void> {
  const firestore = getFirestoreInstance();

  try {
    // Find payment record by ghlTransactionId (invoice ID)
    const paymentsRef = collection(firestore, COLLECTIONS.PAYMENTS);
    const paymentQuery = query(
      paymentsRef,
      where('ghlTransactionId', '==', invoice.id)
    );
    const paymentSnap = await getDocs(paymentQuery);

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (!paymentSnap.empty) {
      const paymentDoc = paymentSnap.docs[0];
      const paymentData = paymentDoc.data() as FirestorePayment;
      userId = paymentData.userId || null;

      // Update payment status to failed
      await updateDoc(paymentDoc.ref, {
        status: 'failed',
        updatedAt: serverTimestamp() as Timestamp,
        failedAt: serverTimestamp() as Timestamp,
        metadata: {
          ...paymentData.metadata,
          ghlInvoiceData: invoice,
          failureReason: 'Invoice payment failed',
        },
      });

      console.log(`❌ Payment failed for invoice: ${invoice.id} (payment: ${paymentDoc.id})`);
    }

    // Find user by GHL contact ID if userId not found
    if (!userId && invoice.contactId) {
      const usersRef = collection(firestore, COLLECTIONS.USERS);
      const userQuery = query(
        usersRef,
        where('ghlId', '==', invoice.contactId)
      );
      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        userId = userDoc.id;
        const userData = userDoc.data() as FirestoreUser;
        userEmail = userData.email;
      }
    }

    // Update user tier to 'free' and send reactivation link
    if (userId) {
      const userRef = doc(firestore, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as FirestoreUser;
        userEmail = userData.email;

        // Generate reactivation link
        const reactivationToken = generateReactivationToken(userId);
        const reactivationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lit.it'}/reactivate?token=${reactivationToken}`;

        // Update user tier to 'free'
        await updateDoc(userRef, {
          tier: 'free',
          updatedAt: serverTimestamp(),
          metadata: {
            ...userData.metadata,
            subscriptionStatus: 'failed',
            subscriptionFailedAt: serverTimestamp(),
            reactivationToken,
            reactivationLink,
          },
        });

        console.log(`✅ User ${userId} tier set to 'free' due to failed payment`);

        // Send reactivation link via GHL or email
        await sendReactivationLink(invoice.contactId, userEmail, reactivationLink);

        console.log(`✅ Reactivation link sent for user ${userId}`);
      }
    } else {
      console.warn(`⚠️ InvoiceFailed: Could not find user for invoice ${invoice.id}`);
    }
  } catch (error) {
    console.error(`❌ Error handling InvoiceFailed event for invoice ${invoice.id}:`, error);
    throw error;
  }
}

/**
 * Generate reactivation token for user
 */
function generateReactivationToken(userId: string): string {
  // Generate a secure token (in production, use crypto.randomBytes)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${userId}-${timestamp}-${random}`;
}

/**
 * Send reactivation link via GHL or email
 */
async function sendReactivationLink(
  contactId: string,
  email: string | null,
  reactivationLink: string
): Promise<void> {
  try {
    // Try to send via GHL if contactId is available
    if (contactId) {
      try {
        const { sendMessage } = await import('@/lib/ghl');
        
        const messageText = `Your subscription payment failed. Click here to reactivate: ${reactivationLink}`;
        await sendMessage(contactId, messageText, undefined, 'email');
        
        console.log(`✅ Reactivation link sent via GHL to contact ${contactId}`);
        return;
      } catch (ghlError) {
        console.warn(`⚠️ Failed to send via GHL, trying email:`, ghlError);
      }
    }

    // Fallback to email if GHL fails or email is available
    if (email) {
      // In production, integrate with your email service (SendGrid, Resend, etc.)
      // For now, we'll log it
      console.log(`📧 Reactivation link for ${email}: ${reactivationLink}`);
      
      // TODO: Integrate with email service
      // await sendEmail({
      //   to: email,
      //   subject: 'Reactivate Your Lit.it Subscription',
      //   html: `Your subscription payment failed. Click here to reactivate: <a href="${reactivationLink}">${reactivationLink}</a>`,
      // });
    }
  } catch (error) {
    console.error('❌ Error sending reactivation link:', error);
    // Don't throw - we don't want to fail the webhook if email fails
  }
}

/**
 * Handle SubscriptionCancelled event
 */
async function handleSubscriptionCancelled(subscription: {
  id: string;
  contactId: string;
  planName?: string;
  amount: number;
  currency: string;
  status: string;
  [key: string]: unknown;
}): Promise<void> {
  const firestore = getFirestoreInstance();

  try {
    // Find payment record by ghlTransactionId (subscription ID)
    const paymentsRef = collection(firestore, COLLECTIONS.PAYMENTS);
    const paymentQuery = query(
      paymentsRef,
      where('ghlTransactionId', '==', subscription.id)
    );
    const paymentSnap = await getDocs(paymentQuery);

    if (paymentSnap.empty) {
      console.warn(`⚠️ SubscriptionCancelled webhook: No payment record found for subscription: ${subscription.id}`);
      
      // Try to find user by GHL contact ID
      const usersRef = collection(firestore, COLLECTIONS.USERS);
      const userQuery = query(
        usersRef,
        where('ghlId', '==', subscription.contactId)
      );
      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        const userData = userDoc.data() as FirestoreUser;
        
        // Update user tier to free and mark subscription as cancelled
        await updateDoc(userDoc.ref, {
          tier: 'free',
          updatedAt: serverTimestamp(),
          metadata: {
            ...userData.metadata,
            subscriptionStatus: 'cancelled',
            subscriptionCancelledAt: serverTimestamp(),
          },
        });

        console.log(`✅ User ${userDoc.id} subscription cancelled, tier set to free`);
      }
      return;
    }

    const paymentDoc = paymentSnap.docs[0];
    const paymentData = paymentDoc.data() as FirestorePayment;

    // Update payment status
    await updateDoc(paymentDoc.ref, {
      status: 'cancelled',
      updatedAt: serverTimestamp() as Timestamp,
      metadata: {
        ...paymentData.metadata,
        ghlSubscriptionData: subscription,
        subscriptionStatus: 'cancelled',
      },
    });

    // Update user tier to free if this was a subscription payment
    if (paymentData.metadata?.type === 'subscription' && paymentData.userId) {
      const userRef = doc(firestore, COLLECTIONS.USERS, paymentData.userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as FirestoreUser;
        await updateDoc(userRef, {
          tier: 'free',
          updatedAt: serverTimestamp(),
          metadata: {
            ...userData.metadata,
            subscriptionStatus: 'cancelled',
            subscriptionCancelledAt: serverTimestamp(),
          },
        });

        console.log(`✅ User ${paymentData.userId} subscription cancelled, tier set to free`);
      }
    }

    console.log(`✅ Subscription cancelled: ${subscription.id} (payment: ${paymentDoc.id})`);
  } catch (error) {
    console.error(`❌ Error handling SubscriptionCancelled event for subscription ${subscription.id}:`, error);
    throw error;
  }
}

