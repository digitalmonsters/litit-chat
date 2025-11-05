import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * POST /api/chat/intro
 * 
 * Send random AI intro DMs to a new user on signup
 * 
 * Body:
 * {
 *   userId: string;        // New user's ID
 *   count?: number;        // Number of intro messages to send (default: 3, max: 10)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, count = 3 } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Validate count
    const introCount = Math.min(Math.max(count, 1), 10);

    const firestore = getFirestoreInstance();

    // Get all AI users
    const aiUsersQuery = query(
      collection(firestore, COLLECTIONS.USERS),
      where('isAI', '==', true)
    );

    const aiUsersSnapshot = await getDocs(aiUsersQuery);

    if (aiUsersSnapshot.empty) {
      return NextResponse.json(
        { error: 'No AI users found' },
        { status: 404 }
      );
    }

    const aiUsers = aiUsersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter AI users that have introScript
    const aiUsersWithIntro = aiUsers.filter((user) => user.introScript);

    if (aiUsersWithIntro.length === 0) {
      return NextResponse.json(
        { error: 'No AI users with intro scripts found' },
        { status: 404 }
      );
    }

    // Randomly select AI users
    const shuffled = aiUsersWithIntro.sort(() => 0.5 - Math.random());
    const selectedAiUsers = shuffled.slice(0, Math.min(introCount, shuffled.length));

    const sentMessages = [];

    // Send intro DM from each selected AI user
    for (const aiUser of selectedAiUsers) {
      try {
        // Create or get chat between new user and AI user
        const chatId = [userId, aiUser.id].sort().join('_');
        const chatRef = doc(firestore, COLLECTIONS.CHATS, chatId);

        // Create chat if it doesn't exist
        await setDoc(
          chatRef,
          {
            id: chatId,
            participantIds: [userId, aiUser.id],
            isGroup: false,
            unreadCounts: {
              [userId]: 1, // New user has 1 unread message
              [aiUser.id]: 0,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Create intro message
        const messageRef = doc(collection(firestore, COLLECTIONS.MESSAGES));
        const messageData = {
          id: messageRef.id,
          chatId,
          senderId: aiUser.id,
          senderName: aiUser.displayName || aiUser.firstName || 'AI Companion',
          senderAvatar: aiUser.photoURL || aiUser.photoUrl,
          content: aiUser.introScript,
          type: 'text',
          status: 'sent',
          timestamp: Timestamp.now(),
          createdAt: serverTimestamp(),
        };

        await setDoc(messageRef, messageData);

        // Update chat with last message
        await setDoc(
          chatRef,
          {
            lastMessageId: messageRef.id,
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        sentMessages.push({
          aiUserId: aiUser.id,
          aiUserName: aiUser.displayName || aiUser.firstName,
          chatId,
          messageId: messageRef.id,
          content: aiUser.introScript,
        });

        console.log(`✅ Sent intro DM from ${aiUser.displayName || aiUser.firstName} to user ${userId}`);
      } catch (error) {
        console.error(`❌ Error sending intro DM from ${aiUser.id}:`, error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sent ${sentMessages.length} intro DMs`,
        sentMessages,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending intro DMs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send intro DMs';
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/intro
 * 
 * Get available AI users for intro DMs
 */
export async function GET(request: NextRequest) {
  try {
    const firestore = getFirestoreInstance();

    // Get all AI users with intro scripts
    const aiUsersQuery = query(
      collection(firestore, COLLECTIONS.USERS),
      where('isAI', '==', true)
    );

    const aiUsersSnapshot = await getDocs(aiUsersQuery);
    const aiUsers = aiUsersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((user) => user.introScript);

    return NextResponse.json(
      {
        success: true,
        count: aiUsers.length,
        aiUsers: aiUsers.map((user) => ({
          id: user.id,
          displayName: user.displayName || user.firstName,
          photoURL: user.photoURL || user.photoUrl,
          bio: user.bio,
          introScript: user.introScript,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching AI users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch AI users';
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
