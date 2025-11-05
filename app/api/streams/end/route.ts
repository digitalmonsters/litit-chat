import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, collection } from 'firebase/firestore';
import type { FirestoreBattle } from '@/lib/firestore-collections';
import { createTransaction, completeTransaction } from '@/lib/transactions';
import { addStars } from '@/lib/wallet';

/**
 * POST /api/streams/end
 * 
 * Handle stream_end webhook from GHL or streaming service
 * Marks battle winner and triggers reward workflow
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
      // Handle battle end
      const battleRef = doc(firestore, COLLECTIONS.BATTLES, streamId);
      const battleSnap = await getDoc(battleRef);

      if (!battleSnap.exists()) {
        return NextResponse.json(
          { error: 'Battle not found' },
          { status: 404 }
        );
      }

      const battleData = battleSnap.data() as FirestoreBattle;

      // Check if already ended
      if (battleData.status === 'ended') {
        return NextResponse.json(
          { error: 'Battle already ended' },
          { status: 400 }
        );
      }

      // Determine winner based on total tips received
      // Track total stars tipped to each host from transaction records
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

      battleTipsSnap.forEach((doc) => {
        const tipData = doc.data();
        if (tipData.battleHostId === battleData.host1Id) {
          host1TotalTips += tipData.amount;
        } else if (tipData.battleHostId === battleData.host2Id) {
          host2TotalTips += tipData.amount;
        }
      });

      // Use transaction totals if available, otherwise fall back to battle data
      const finalHost1Tips = host1TotalTips > 0 ? host1TotalTips : battleData.host1Tips;
      const finalHost2Tips = host2TotalTips > 0 ? host2TotalTips : battleData.host2Tips;

      // Determine winner based on tips
      const winnerId =
        finalHost1Tips > finalHost2Tips
          ? battleData.host1Id
          : finalHost1Tips < finalHost2Tips
          ? battleData.host2Id
          : null; // Tie

      // Calculate reward (e.g., 50% of total tips)
      const totalTips = finalHost1Tips + finalHost2Tips;
      const rewardAmount = winnerId ? Math.floor(totalTips * 0.5) : 0;

      // Update battle status with accurate tip totals
      await updateDoc(battleRef, {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration: duration || battleData.duration,
        peakViewers: viewerCount || battleData.peakViewers,
        host1Tips: finalHost1Tips,
        host2Tips: finalHost2Tips,
        totalTips: totalTips,
        winnerId,
        rewardAmount,
        updatedAt: serverTimestamp(),
      });

      // Award reward to winner
      if (winnerId && rewardAmount > 0) {
        // Add stars to winner's wallet
        const rewardResult = await addStars(
          winnerId,
          rewardAmount,
          `Battle reward for winning battle ${streamId}`
        );

        if (rewardResult.success) {
          // Create reward transaction
          const transaction = await createTransaction({
            userId: winnerId,
            type: 'battle_reward',
            amount: rewardAmount,
            currency: 'STARS',
            battleId: streamId,
            description: `Battle reward for winning battle ${streamId}`,
            metadata: {
              battleId: streamId,
              totalTips: totalTips,
              host1Tips: finalHost1Tips,
              host2Tips: finalHost2Tips,
            },
          });

          await completeTransaction(transaction.id);

          // Update battle with reward transaction ID
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
        host1Tips: finalHost1Tips,
        host2Tips: finalHost2Tips,
        totalTips: totalTips,
      });
    } else if (type === 'liveparty') {
      // Handle LiveParty end
      const partyRef = doc(firestore, COLLECTIONS.LIVEPARTIES, streamId);
      const partySnap = await getDoc(partyRef);

      if (!partySnap.exists()) {
        return NextResponse.json(
          { error: 'LiveParty not found' },
          { status: 404 }
        );
      }

      const partyData = partySnap.data();

      // Update LiveParty status
      await updateDoc(partyRef, {
        status: 'ended',
        endedAt: serverTimestamp(),
        duration: duration || partyData.duration,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        totalRevenue: partyData.totalEntryRevenue + partyData.totalViewerRevenue,
        totalTips: partyData.totalTips,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid stream type. Must be "battle" or "liveparty"' },
        { status: 400 }
      );
    }
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

