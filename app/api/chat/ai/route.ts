import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import OpenAI from 'openai';

/**
 * POST /api/chat/ai
 * 
 * Generate AI reply for AI user companion
 * Triggered when a message is sent to an AI user
 * 
 * Body:
 * {
 *   chatId: string;
 *   aiUserId: string;
 *   userMessage: string;
 *   senderId: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, aiUserId, userMessage, senderId } = body;

    // Validate required fields
    if (!chatId || !aiUserId || !userMessage || !senderId) {
      return NextResponse.json(
        { error: 'Missing required fields: chatId, aiUserId, userMessage, senderId' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Get AI user data
    const aiUserRef = doc(firestore, COLLECTIONS.USERS, aiUserId);
    const aiUserSnap = await getDoc(aiUserRef);

    if (!aiUserSnap.exists()) {
      return NextResponse.json(
        { error: 'AI user not found' },
        { status: 404 }
      );
    }

    const aiUser = aiUserSnap.data();

    // Verify this is actually an AI user
    if (!aiUser.isAI) {
      return NextResponse.json(
        { error: 'User is not an AI companion' },
        { status: 400 }
      );
    }

    // Get conversation history for context (last 10 messages)
    const messagesQuery = query(
      collection(firestore, COLLECTIONS.MESSAGES),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const messagesSnapshot = await getDocs(messagesQuery);
    const conversationHistory = messagesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          role: data.senderId === aiUserId ? 'assistant' : 'user',
          content: data.content || '',
        };
      })
      .reverse(); // Reverse to get chronological order

    // Generate AI reply using OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Build persona prompt
    const firstName = aiUser.firstName || aiUser.displayName || 'AI';
    const bio = aiUser.bio || 'friendly AI companion';
    const personaPrompt = `You are ${firstName}, ${bio}. Respond playfully.`;

    // Prepare messages for OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: personaPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 150,
      temperature: 0.9,
    });

    const aiReply = completion.choices[0]?.message?.content?.trim();

    if (!aiReply) {
      return NextResponse.json(
        { error: 'Failed to generate AI reply' },
        { status: 500 }
      );
    }

    // Save AI reply as a Firestore message
    const messageRef = doc(collection(firestore, COLLECTIONS.MESSAGES));
    const messageData = {
      id: messageRef.id,
      chatId,
      senderId: aiUserId,
      senderName: aiUser.displayName || firstName,
      senderAvatar: aiUser.photoURL || aiUser.photoUrl,
      content: aiReply,
      type: 'text',
      status: 'sent',
      timestamp: Timestamp.now(),
      createdAt: serverTimestamp(),
    };

    await setDoc(messageRef, messageData);

    // Update chat last message
    const chatRef = doc(firestore, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      const unreadCounts = { ...(chatData.unreadCounts || {}) };
      unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;

      await setDoc(
        chatRef,
        {
          lastMessageId: messageRef.id,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCounts,
        },
        { merge: true }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          ...messageData,
          createdAt: new Date(),
          timestamp: new Date(),
        },
        reply: aiReply,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating AI reply:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI reply';
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
