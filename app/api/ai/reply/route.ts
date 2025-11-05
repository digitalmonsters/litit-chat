import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance } from '@/lib/firebase';
import { generateAIReply, getConversationHistory, isAICompanion } from '@/lib/ai-companion';
import type { AIPersonality } from '@/lib/ai-companion';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/firestore-collections';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, aiUserId, userMessage, userName } = body;

    if (!chatId || !aiUserId || !userMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const firestore = getFirestoreInstance();
    const aiUserRef = doc(firestore, COLLECTIONS.USERS, aiUserId);
    const aiUserSnap = await getDoc(aiUserRef);

    if (!aiUserSnap.exists()) {
      return NextResponse.json({ error: 'AI user not found' }, { status: 404 });
    }

    const aiUser = aiUserSnap.data();

    if (!isAICompanion(aiUser)) {
      return NextResponse.json({ error: 'Not an AI companion' }, { status: 400 });
    }

    const personality = aiUser.aiPersonality as AIPersonality;
    const conversationHistory = await getConversationHistory(firestore, chatId, 10);
    const aiReply = await generateAIReply(personality, userMessage, conversationHistory, userName);

    return NextResponse.json({
      success: true,
      reply: aiReply,
      personality,
      aiName: aiUser.displayName,
    });
  } catch (error) {
    console.error('AI reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { AI_COMPANIONS } = await import('@/lib/ai-companion');
  return NextResponse.json({
    success: true,
    companions: AI_COMPANIONS,
  });
}
