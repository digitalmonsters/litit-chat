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
  startAfter,
} from 'firebase/firestore';
import type {
  FirestoreMessage,
  FirestoreChat,
  CreateMessageData,
} from '@/lib/firestore-collections';

/**
 * POST /api/chat
 * 
 * Send a message to a chat room
 * 
 * Body:
 * {
 *   chatId: string;
 *   senderId: string;
 *   senderName: string;
 *   senderAvatar?: string;
 *   content: string;
 *   type?: 'text' | 'image' | 'file' | 'system' | 'payment';
 *   replyTo?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chatId,
      senderId,
      senderName,
      senderAvatar,
      content,
      type = 'text',
      replyTo,
    }: CreateMessageData = body;

    // Validate required fields
    if (!chatId || !senderId || !senderName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: chatId, senderId, senderName, content' },
        { status: 400 }
      );
    }

    // Validate content
    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Message content exceeds maximum length of 10000 characters' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();

    // Verify chat exists
    const chatRef = doc(firestore, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return NextResponse.json(
        { error: 'Chat room not found' },
        { status: 404 }
      );
    }

    const chatData = chatSnap.data() as FirestoreChat;

    // Verify sender is a participant
    if (!chatData.participantIds.includes(senderId)) {
      return NextResponse.json(
        { error: 'User is not a participant in this chat' },
        { status: 403 }
      );
    }

    // Create message
    const messageRef = doc(collection(firestore, COLLECTIONS.MESSAGES));
    const messageData: FirestoreMessage = {
      id: messageRef.id,
      chatId,
      senderId,
      senderName,
      senderAvatar,
      content: content.trim(),
      type,
      status: 'sent',
      timestamp: Timestamp.now(),
      createdAt: serverTimestamp() as Timestamp,
      ...(replyTo && { replyTo }),
    };

    await setDoc(messageRef, messageData);

    // Update chat last message
    await setDoc(
      chatRef,
      {
        lastMessageId: messageRef.id,
        lastMessageAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      },
      { merge: true }
    );

    // Update unread counts for other participants
    const otherParticipants = chatData.participantIds.filter(id => id !== senderId);
    const unreadCounts = { ...chatData.unreadCounts };
    otherParticipants.forEach((participantId) => {
      unreadCounts[participantId] = (unreadCounts[participantId] || 0) + 1;
    });

    await setDoc(
      chatRef,
      { unreadCounts },
      { merge: true }
    );

    // Send push notifications to other participants (non-blocking)
    // Note: This will be handled by Cloud Function onMessageCreated
    // But we can also trigger it here for immediate delivery
    if (typeof window === 'undefined') {
      // Server-side only
      import('@/lib/push-notifications')
        .then(({ sendMessageNotification }) => {
          sendMessageNotification(chatId, senderId, senderName, content, type)
            .catch((err) => console.error('Error sending push notification:', err));
        })
        .catch((err) => console.error('Error loading push-notifications:', err));
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          ...messageData,
          createdAt: new Date(),
          timestamp: new Date(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
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
 * GET /api/chat
 * 
 * Get messages for a chat room
 * 
 * Query params:
 * - chatId: string (required)
 * - limit: number (default: 50, max: 100)
 * - before?: string (message ID to paginate before)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId query parameter is required' },
        { status: 400 }
      );
    }

    // Validate limit
    const messageLimit = Math.min(Math.max(limitParam, 1), 100);

    const firestore = getFirestoreInstance();

    // Verify chat exists
    const chatRef = doc(firestore, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return NextResponse.json(
        { error: 'Chat room not found' },
        { status: 404 }
      );
    }

    // Build query
    const messagesRef = collection(firestore, COLLECTIONS.MESSAGES);
    let messagesQuery = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(messageLimit)
    );

    // Handle pagination
    if (before) {
      const beforeDoc = await getDoc(doc(firestore, COLLECTIONS.MESSAGES, before));
      if (beforeDoc.exists()) {
        messagesQuery = query(
          messagesRef,
          where('chatId', '==', chatId),
          orderBy('timestamp', 'desc'),
          startAfter(beforeDoc),
          limit(messageLimit)
        );
      }
    }

    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreMessage;
      return {
        ...data,
        timestamp: data.timestamp instanceof Timestamp 
          ? data.timestamp.toDate().toISOString()
          : data.timestamp,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      };
    });

    // Reverse to get chronological order (oldest first)
    messages.reverse();

    return NextResponse.json(
      {
        success: true,
        messages,
        count: messages.length,
        hasMore: messages.length === messageLimit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
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
 * PUT /api/chat
 * 
 * Update a message (e.g., mark as read, edit)
 * 
 * Body:
 * {
 *   messageId: string;
 *   updates: {
 *     status?: 'sent' | 'delivered' | 'read';
 *     content?: string;
 *     readBy?: Record<string, Timestamp>;
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, updates } = body;

    if (!messageId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, updates' },
        { status: 400 }
      );
    }

    const firestore = getFirestoreInstance();
    const messageRef = doc(firestore, COLLECTIONS.MESSAGES, messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    const updateData: Partial<FirestoreMessage> = {
      updatedAt: serverTimestamp() as Timestamp,
      ...updates,
    };

    // If editing content, mark as edited
    if (updates.content) {
      updateData.isEdited = true;
      updateData.editedAt = serverTimestamp() as Timestamp;
    }

    await setDoc(messageRef, updateData, { merge: true });

    return NextResponse.json(
      {
        success: true,
        message: 'Message updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update message';
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

