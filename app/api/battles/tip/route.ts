import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { FirestoreBattle } from '@/lib/firestore-collections';
import {
  createTransactionAndDeductWallet,
  completeTransaction,
} from '@/lib/transactions';
import { getWallet } from '@/lib/wallet';

/**
 * POST /api/battles/tip
 * 
 * Tip stars to a battle host
 * 
 * Body:
 * {
 *   battleId: string;
 *   hostId: string; // Host receiving the tip
 *   userId: string; // User sending the tip
 *   amount: number; // Amount in stars
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { battleId, hostId, userId, amount } = body;

    if (!battleId || !hostId || !userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: battleId, hostId, userId, amount' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Tip amount must be greater than 0' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Get battle record
    const battleRef = doc(firestore, COLLECTIONS.BATTLES, battleId);
    const battleSnap = await getDoc(battleRef);

    if (!battleSnap.exists()) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      );
    }

    const battleData = battleSnap.data() as FirestoreBattle;

    // Check if battle is live
    if (battleData.status !== 'live') {
      return NextResponse.json(
        { error: 'Battle is not live' },
        { status: 400 }
      );
    }

    // Verify host is in battle
    if (battleData.host1Id !== hostId && battleData.host2Id !== hostId) {
      return NextResponse.json(
        { error: 'Host not found in battle' },
        { status: 400 }
      );
    }

    // Check wallet balance
    const wallet = await getWallet(userId);
    if (!wallet || wallet.stars < amount) {
      return NextResponse.json(
        { error: 'Insufficient stars balance', required: amount, available: wallet?.stars || 0 },
        { status: 400 }
      );
    }

    // Create transaction and deduct from wallet
    const transaction = await createTransactionAndDeductWallet({
      userId,
      type: 'battle_tip',
      amount,
      currency: 'STARS',
      battleId,
      battleHostId: hostId,
      description: `Tip to ${hostId} in battle ${battleId}`,
    });

    // Complete transaction
    await completeTransaction(transaction.transaction.id);

    // Update battle tips
    const isHost1 = battleData.host1Id === hostId;
    const newHost1Tips = isHost1
      ? battleData.host1Tips + amount
      : battleData.host1Tips;
    const newHost2Tips = !isHost1
      ? battleData.host2Tips + amount
      : battleData.host2Tips;

    await updateDoc(battleRef, {
      host1Tips: newHost1Tips,
      host2Tips: newHost2Tips,
      totalTips: battleData.totalTips + amount,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.transaction.id,
      host1Tips: newHost1Tips,
      host2Tips: newHost2Tips,
      totalTips: battleData.totalTips + amount,
    });
  } catch (error) {
    console.error('Error tipping battle host:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to tip battle host',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

