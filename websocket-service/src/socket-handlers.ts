import { Server, Socket } from 'socket.io';
import admin from 'firebase-admin';
import { getFirestore } from './firebase';

const COLLECTIONS = {
  CHATS: 'chats',
  MESSAGES: 'messages',
  USERS: 'users',
};

interface SocketUser {
  userId: string;
  socketId: string;
  connectedAt: Date;
}

interface TypingState {
  userId: string;
  userName: string;
  chatId: string;
  timestamp: Date;
}

// Store active socket connections
const activeConnections = new Map<string, SocketUser>();
// Store typing states per chat
const typingStates = new Map<string, Map<string, TypingState>>();

/**
 * Setup socket event handlers
 */
export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Authentication: Expect userId in handshake auth or query
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    
    if (!userId || typeof userId !== 'string') {
      console.warn(`⚠️  Socket ${socket.id} connected without userId, disconnecting...`);
      socket.disconnect();
      return;
    }

    // Store connection
    activeConnections.set(socket.id, {
      userId,
      socketId: socket.id,
      connectedAt: new Date(),
    });

    // Join user's personal room for presence updates
    socket.join(`user:${userId}`);

    // Update user presence in Firestore
    updateUserPresence(userId, 'online').catch((err) =>
      console.error(`Error updating presence for ${userId}:`, err)
    );

    // ============================================
    // JOIN CHAT ROOM
    // ============================================
    socket.on('joinChat', async (data: { chatId: string }) => {
      const { chatId } = data;
      if (!chatId) {
        socket.emit('error', { message: 'chatId is required' });
        return;
      }

      // Verify user is a participant in the chat
      const firestore = getFirestore();
      const chatDoc = await firestore.collection(COLLECTIONS.CHATS).doc(chatId).get();

      if (!chatDoc.exists) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const chatData = chatDoc.data();
      if (!chatData?.participantIds?.includes(userId)) {
        socket.emit('error', { message: 'User is not a participant in this chat' });
        return;
      }

      // Join chat room
      socket.join(`chat:${chatId}`);
      console.log(`👤 User ${userId} joined chat ${chatId}`);
      
      // Update lastSeen for user in this chat
      await updateUserLastSeenInChat(userId, chatId).catch((err) =>
        console.error(`Error updating lastSeen:`, err)
      );

      // Emit current typing states for this chat
      const chatTypingStates = typingStates.get(chatId);
      if (chatTypingStates && chatTypingStates.size > 0) {
        const typingUsers = Array.from(chatTypingStates.values())
          .filter((state) => state.userId !== userId)
          .map((state) => ({
            userId: state.userId,
            userName: state.userName,
          }));
        
        if (typingUsers.length > 0) {
          socket.emit('userTyping', {
            chatId,
            users: typingUsers,
          });
        }
      }

      socket.emit('joinedChat', { chatId });
    });

    // ============================================
    // USER TYPING
    // ============================================
    socket.on('userTyping', async (data: { chatId: string; userName: string }) => {
      const { chatId, userName } = data;
      if (!chatId) {
        return;
      }

      // Store typing state
      if (!typingStates.has(chatId)) {
        typingStates.set(chatId, new Map());
      }

      const chatTypingStates = typingStates.get(chatId)!;
      chatTypingStates.set(userId, {
        userId,
        userName: userName || 'User',
        chatId,
        timestamp: new Date(),
      });

      // Broadcast to other users in the chat
      socket.to(`chat:${chatId}`).emit('userTyping', {
        chatId,
        users: [{ userId, userName: userName || 'User' }],
      });

      // Sync to Firestore (for presence tracking)
      await syncTypingStateToFirestore(chatId, userId, userName).catch((err) =>
        console.error(`Error syncing typing state:`, err)
      );
      
      // Update user presence with typing status
      await updateUserTypingStatus(userId, chatId, true).catch((err) =>
        console.error(`Error updating typing status:`, err)
      );

      // Clear typing state after 3 seconds of inactivity
      setTimeout(() => {
        const currentState = chatTypingStates.get(userId);
        if (currentState) {
          const timeSinceLastTyping = Date.now() - currentState.timestamp.getTime();
          if (timeSinceLastTyping >= 3000) {
            chatTypingStates.delete(userId);
            socket.to(`chat:${chatId}`).emit('userStoppedTyping', {
              chatId,
              userId,
            });
            
            // Clear typing status in Firestore
            updateUserTypingStatus(userId, chatId, false).catch((err) =>
              console.error(`Error clearing typing status:`, err)
            );
            
            // Clear from Firestore chat document
            clearTypingStateFromFirestore(chatId, userId).catch((err) =>
              console.error(`Error clearing typing state from Firestore:`, err)
            );
          }
        }
      }, 3000);
    });

    // ============================================
    // MESSAGE READ
    // ============================================
    socket.on('messageRead', async (data: { chatId: string; messageId: string; messageIds?: string[] }) => {
      const { chatId, messageId, messageIds } = data;
      const idsToMark = messageIds || [messageId];

      if (!chatId || !idsToMark.length) {
        socket.emit('error', { message: 'chatId and messageId(s) are required' });
        return;
      }

      const firestore = getFirestore();
      const batch = firestore.batch();

      // Update each message's read status
      for (const msgId of idsToMark) {
        const messageRef = firestore.collection(COLLECTIONS.MESSAGES).doc(msgId);
        const messageDoc = await messageRef.get();

        if (messageDoc.exists) {
          const messageData = messageDoc.data();
          if (messageData?.chatId === chatId) {
            // Update read receipts
            // Handle both array and object formats for readBy
            let readBy: Record<string, admin.firestore.Timestamp> = {};
            
            if (messageData.readBy) {
              if (Array.isArray(messageData.readBy)) {
                // Convert array to object format
                messageData.readBy.forEach((uid: string) => {
                  readBy[uid] = admin.firestore.Timestamp.now();
                });
              } else if (typeof messageData.readBy === 'object') {
                readBy = { ...messageData.readBy };
              }
            }
            
            readBy[userId] = admin.firestore.FieldValue.serverTimestamp() as any;
            
            batch.update(messageRef, {
              readBy,
              status: 'read',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      await batch.commit();

      // Broadcast read receipt to other participants
      socket.to(`chat:${chatId}`).emit('messageRead', {
        chatId,
        messageIds: idsToMark,
        readBy: userId,
        timestamp: new Date().toISOString(),
      });

      // Update chat unread counts
      await updateChatUnreadCounts(chatId, userId).catch((err) =>
        console.error(`Error updating unread counts:`, err)
      );
    });

    // ============================================
    // PRESENCE PING
    // ============================================
    socket.on('presencePing', async (data?: { status?: 'online' | 'away' | 'busy' }) => {
      const status = data?.status || 'online';
      
      await updateUserPresence(userId, status).catch((err) =>
        console.error(`Error updating presence:`, err)
      );

      // Broadcast presence update to user's contacts/chats
      // This would require fetching user's active chats
      // For now, we'll just update Firestore
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      const connection = activeConnections.get(socket.id);
      if (connection) {
        activeConnections.delete(socket.id);

        // Update presence to offline
        await updateUserPresence(connection.userId, 'offline').catch((err) =>
          console.error(`Error updating presence on disconnect:`, err)
        );

        // Remove typing states
        for (const [chatId, chatTypingStates] of typingStates.entries()) {
          if (chatTypingStates.has(connection.userId)) {
            chatTypingStates.delete(connection.userId);
            socket.to(`chat:${chatId}`).emit('userStoppedTyping', {
              chatId,
              userId: connection.userId,
            });
            
            // Clear from Firestore
            await clearTypingStateFromFirestore(chatId, connection.userId).catch((err) =>
              console.error(`Error clearing typing state from Firestore:`, err)
            );
          }
        }
        
        // Clear typing status in user presence
        await updateUserTypingStatus(connection.userId, '', false).catch((err) =>
          console.error(`Error clearing typing status:`, err)
        );
      }
    });

    // ============================================
    // LEAVE CHAT
    // ============================================
    socket.on('leaveChat', async (data: { chatId: string }) => {
      const { chatId } = data;
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`👤 User ${userId} left chat ${chatId}`);
        
        // Update lastSeen
        await updateUserLastSeenInChat(userId, chatId).catch((err) =>
          console.error(`Error updating lastSeen on leave:`, err)
        );
        
        // Remove typing state
        const chatTypingStates = typingStates.get(chatId);
        if (chatTypingStates?.has(userId)) {
          chatTypingStates.delete(userId);
          socket.to(`chat:${chatId}`).emit('userStoppedTyping', {
            chatId,
            userId,
          });
          
          // Clear typing status in Firestore
          await updateUserTypingStatus(userId, chatId, false).catch((err) =>
            console.error(`Error clearing typing status:`, err)
          );
          
          // Clear from Firestore chat document
          await clearTypingStateFromFirestore(chatId, userId).catch((err) =>
            console.error(`Error clearing typing state from Firestore:`, err)
          );
        }
        
        socket.emit('leftChat', { chatId });
      }
    });
  });
}

/**
 * Update user presence in Firestore
 */
async function updateUserPresence(userId: string, status: 'online' | 'offline' | 'away' | 'busy'): Promise<void> {
  const firestore = getFirestore();
  const userRef = firestore.collection(COLLECTIONS.USERS).doc(userId);
  
  // Update both top-level status and nested presence object for consistency
  await userRef.set(
    {
      status,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      presence: {
        status,
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );
  
  console.log(`✅ Updated presence for ${userId}: ${status}`);
}

/**
 * Sync typing state to Firestore (for persistence)
 */
async function syncTypingStateToFirestore(
  chatId: string,
  userId: string,
  userName: string
): Promise<void> {
  const firestore = getFirestore();
  const chatRef = firestore.collection(COLLECTIONS.CHATS).doc(chatId);
  
  // Store typing state in chat metadata
  await chatRef.set(
    {
      typingUsers: admin.firestore.FieldValue.arrayUnion({
        userId,
        userName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Update chat unread counts after marking messages as read
 */
async function updateChatUnreadCounts(chatId: string, userId: string): Promise<void> {
  const firestore = getFirestore();
  const chatRef = firestore.collection(COLLECTIONS.CHATS).doc(chatId);
  const chatDoc = await chatRef.get();

  if (chatDoc.exists) {
    const chatData = chatDoc.data();
    const unreadCounts = chatData?.unreadCounts || {};
    
    // Reset unread count for this user
    unreadCounts[userId] = 0;

    await chatRef.update({
      unreadCounts,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Update user typing status in presence
 */
async function updateUserTypingStatus(userId: string, chatId: string, isTyping: boolean): Promise<void> {
  const firestore = getFirestore();
  const userRef = firestore.collection(COLLECTIONS.USERS).doc(userId);
  
  await userRef.set(
    {
      presence: {
        isTyping,
        currentChat: isTyping ? chatId : '',
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

