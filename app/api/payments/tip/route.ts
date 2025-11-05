import { NextRequest, NextResponse } from 'next/server';
import { spendStars } from '@/lib/wallet';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';

/**
 * POST /api/payments/tip
 * 
 * Send tip using stars or card payment
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipientId, amount, method } = body;

    if (!userId || !recipientId || !amount || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (method === 'stars') {
      // Deduct stars from sender
      const result = await spendStars(userId, amount, `Tip to ${recipientId}`);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to send tip' },
          { status: 400 }
        );
      }

      // Add stars to recipient (or create payment record)
      const db = getFirestoreInstance();
      const recipientRef = doc(db, COLLECTIONS.USERS, recipientId);
      const recipientSnap = await getDoc(recipientRef);

      if (recipientSnap.exists()) {
        // Update recipient's wallet or create payment record
        // This depends on your wallet structure
      }

      return NextResponse.json({
        success: true,
        message: 'Tip sent successfully',
        newBalance: result.newBalance,
      });
    } else {
      // Card payment - create payment intent
      // This would be handled by the existing /api/payments/create route
      return NextResponse.json(
        { error: 'Card payment not implemented in this endpoint. Use /api/payments/create' },
        { status: 400 }
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending tip:', error);
    return NextResponse.json(
      { error: 'Failed to send tip' },
      { status: 500 }
    );
  }
}

