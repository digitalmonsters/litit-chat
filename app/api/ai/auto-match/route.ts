import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { getOrCreateAICompanion, AI_COMPANIONS, createAICompanion } from '@/lib/ai-companion';
import type { AIPersonality } from '@/lib/ai-companion';
import { collection, doc, setDoc, query, where, getDocs, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { FirestoreChat } from '@/lib/firestore-collections';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, preferredPersonality } = body;

    if (!userId || !userName) {
      return NextResponse.json({ error: 'Missing userId or userName' }, { status: 400 });
    }

    const firestore = getFirestoreInstance();
    const existingChatsQuery = query(
      collection(firestore, COLLECTIONS.CHATS),
      where('participantIds', 'array-contains', userId),
      limit(1)
    );

    const existingChatsSnap = await getDocs(existingChatsQuery);
    if (!existingChatsSnap.empty) {
      return NextResponse.json({ success: false, matched: false, message: 'User already has chats' });
    }

    let aiCompanion;
    if (preferredPersonality && AI_COMPANIONS[preferredPersonality as AIPersonality]) {
      const aiQuery = query(
        collection(firestore, COLLECTIONS.USERS),
        where('isAI', '==', true),
        where('aiPersonality', '==', preferredPersonality),
        limit(1)
      );
      const aiSnapshot = await getDocs(aiQuery);
      if (!aiSnapshot.empty) {
        aiCompanion = aiSnapshot.docs[0].data();
      } else {
        aiCompanion = await createAICompanion(firestore, preferredPersonality as AIPersonality);
      }
    } else {
      aiCompanion = await getOrCreateAICompanion(firestore);
    }

    const chatRef = doc(collection(firestore, COLLECTIONS.CHATS));
    const chatData: FirestoreChat = {
      id: chatRef.id,
      participantIds: [userId, aiCompanion.id],
      unreadCounts: { [userId]: 0, [aiCompanion.id]: 0 },
      isGroup: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      metadata: { isAIChat: true, aiPersonality: aiCompanion.aiPersonality, autoMatched: true },
    };

    await setDoc(chatRef, chatData);

    const welcomeMessages: Record<string, string> = {
      fun: \`Hey \${userName}! 🎉 I'm \${aiCompanion.displayName}! What's on your mind?\`,
      flirty: \`Hey \${userName}! 😘 I'm \${aiCompanion.displayName}. How's your day?\`,
      supportive: \`Hi \${userName}! 💙 I'm \${aiCompanion.displayName}. How are you feeling?\`,
      creative: \`Hello \${userName}! 🎨 I'm \${aiCompanion.displayName}. What inspires you?\`,
    };

    const welcomeMessage = welcomeMessages[aiCompanion.aiPersonality] || \`Hi \${userName}! I'm \${aiCompanion.displayName}.\`;
    const messageRef = doc(collection(firestore, COLLECTIONS.MESSAGES));
    await setDoc(messageRef, {
      id: messageRef.id,
      chatId: chatRef.id,
      senderId: aiCompanion.id,
      senderName: aiCompanion.displayName,
      senderAvatar: aiCompanion.photoURL,
      content: welcomeMessage,
      type: 'text',
      status: 'sent',
      timestamp: Timestamp.now(),
      createdAt: serverTimestamp() as Timestamp,
    });

    await setDoc(chatRef, {
      lastMessageId: messageRef.id,
      lastMessageAt: serverTimestamp() as Timestamp,
      unreadCounts: { ...chatData.unreadCounts, [userId]: 1 },
    }, { merge: true });

    return NextResponse.json({
      success: true,
      matched: true,
      chat: {
        id: chatRef.id,
        aiCompanion: {
          id: aiCompanion.id,
          name: aiCompanion.displayName,
          avatar: aiCompanion.photoURL,
          personality: aiCompanion.aiPersonality,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Auto-match error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const firestore = getFirestoreInstance();
    const existingChatsQuery = query(
      collection(firestore, COLLECTIONS.CHATS),
      where('participantIds', 'array-contains', userId),
      limit(1)
    );

    const existingChatsSnap = await getDocs(existingChatsQuery);
    return NextResponse.json({
      success: true,
      eligible: existingChatsSnap.empty,
      hasExistingChats: !existingChatsSnap.empty,
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
