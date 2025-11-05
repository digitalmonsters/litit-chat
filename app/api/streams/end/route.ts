import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  collection 
} from 'firebase/firestore';
import type { FirestoreBattle } from '@/lib/firestore-collections';
import { createTransaction, completeTransaction } from '@/lib/transactions';
import { addStars } from '@/lib/wallet';

/**
 * POST /api/streams/end
 * Handles stream_end webhook from GHL or streaming service.
 * Marks battle winner and triggers reward workflow.
 *
 * Body:
 * {
 *   streamId: string; // Battle ID or LiveParty ID
 *   type: 'battle' | 'liveparty';
 *   duration?: number; // Duration in seconds
 *   viewerCount?: number;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId, type, duration, viewerCount } = body;

    if (!streamId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: streamId, type' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    if (type === 'battle') {
      const battleRef = doc(firestore, COLLECTIONS.BATTLES, streamId);
      const battleSnap = await getDoc(battleRef);

      if (!battleSnap.exists()) {
        return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
      }

      const battleData = battleSnap.data() as FirestoreBattle;

      if (battleData.status === 'ended') {
        return NextResponse.json(
          { error: 'Battle already ended' },
          { status: 400 }
        );
      }

      // Retrieve tip transactions
      const transactionsRef = collection(firestore, COLLECTIONS.TRANSACTIONS);
      const battleTipsQuery = query(
        transactionsRef,
        where('battleId', '==', streamId),
        where('type', '==', 'battle_tip'),
        where('status', '==', 'completed')
      );
      const battleTipsSnap = await getDocs(battleTipsQuery);

      let host1TotalTips = 0;
      let host2TotalTips = 0;

      battleTipsSnap.forEach((docSnap) => {
        const tipData = docSnap.data();
        const amount = tipData.amount || 0;

        if (tipData.battleHostId === battleData.host1Id) {
          host1TotalTips += amount;
        } else if (tipData.battleHostId === battleData.host2Id) {
          host2TotalTips += amount;
        }
      });

      const finalHost1Tips = host1TotalTips > 0 ? host1TotalTips : (battleData.host1Tips ?? 0);
      const finalHost2Tips = host2TotalTips > 0 ? host2TotalTips : (battleData.host2Tips ?? 0);

      // Safely coalesce undefined to 0 before comparison
      const host1Safe = finalHost1Tips ?? 0;
      const host2Safe = finalHost2Tips ?? 0;

      const winnerId =
        host1Safe > host2Safe
          ? battleData.host1Id
          : host1Safe < host2Safe
          ? battleData.host2Id
          : null;

      const totalTips = host1Safe + host2Safe;
      const rewardAmount = winnerId ? Math.floor(totalTips * 0.5) : 0;

      await updateDoc(battleRef, {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration: duration ?? battleData.duration,
        peakViewers: viewerCount ?? battleData.peakViewers,
        host1Tips: host1Safe,
        host2Tips: host2Safe,
        totalTips,
        winnerId,
        rewardAmount,
        updatedAt: serverTimestamp(),
      });

      if (winnerId && rewardAmount > 0) {
        const rewardResult = await addStars(
          winnerId,
          rewardAmount,
          `Battle reward for winning battle ${streamId}`
        );

        if (rewardResult.success) {
          const transaction = await createTransaction({
            userId: winnerId,
            type: 'battle_reward',
            amount: rewardAmount,
            currency: 'STARS',
            battleId: streamId,
            description: `Battle reward for winning battle ${streamId}`,
            metadata: {
              battleId: streamId,
              totalTips,
              host1Tips: host1Safe,
              host2Tips: host2Safe,
            },
          });

          await completeTransaction(transaction.id);

          await updateDoc(battleRef, {
            rewardTransactionId: transaction.id,
            updatedAt: serverTimestamp(),
          });

          console.log(`✅ Battle reward: ${rewardAmount} stars awarded to ${winnerId}`);
        }
      }

      return NextResponse.json({
        success: true,
        winnerId,
        rewardAmount,
        host1Tips: host1Safe,
        host2Tips: host2Safe,
        totalTips,
      });
    }

    if (type === 'liveparty') {
      const partyRef = doc(firestore, COLLECTIONS.LIVEPARTIES, streamId);
      const partySnap = await getDoc(partyRef);

      if (!partySnap.exists()) {
        return NextResponse.json({ error: 'LiveParty not found' }, { status: 404 });
      }

      const partyData = partySnap.data() || {};

      await updateDoc(partyRef, {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration: duration ?? partyData.duration,
        updatedAt: serverTimestamp(),
      });

      const totalRevenue = (partyData.totalEntryRevenue ?? 0) + (partyData.totalViewerRevenue ?? 0);
      const totalTips = partyData.totalTips ?? 0;

      return NextResponse.json({
        success: true,
        totalRevenue,
        totalTips,
      });
    }

    return NextResponse.json(
      { error: 'Invalid stream type. Must be "battle" or "liveparty"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling stream end:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to handle stream end',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
