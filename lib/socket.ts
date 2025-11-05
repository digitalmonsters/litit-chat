'use client';

/**
 * WebSocket Client Utilities
 * 
 * Provides Socket.IO client integration for real-time chat events:
 * - Typing indicators
 * - Read receipts
 * - Presence updates
 */

import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

interface SocketOptions {
  userId: string;
  userName?: string;
  autoConnect?: boolean;
}

/**
 * Create and connect to WebSocket server
 */
export function createSocket(options: SocketOptions): Socket {
  const { userId, userName, autoConnect = true } = options;

  if (!userId) {
    throw new Error('userId is required to create socket connection');
  }

  const socket = io(WEBSOCKET_URL, {
    auth: {
      userId,
    },
    query: {
      userId,
    },
    autoConnect,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });

  return socket;
}

/**
 * React hook for socket connection
 */
export function useSocket(options: SocketOptions) {
  const { userId, userName, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Create socket if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = createSocket({ userId, userName, autoConnect });
    }

    const socket = socketRef.current;

    // Connection state handlers
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Set initial connection state
    setIsConnected(socket.connected);

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      
      // Only disconnect if component unmounts
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, userName, autoConnect]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

/**
 * Join a chat room
 */
export function joinChat(socket: Socket | null, chatId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket is not connected'));
      return;
    }

    socket.emit('joinChat', { chatId }, (response?: { error?: string }) => {
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve();
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Join chat timeout'));
    }, 5000);
  });
}

/**
 * Leave a chat room
 */
export function leaveChat(socket: Socket | null, chatId: string): void {
  if (socket && socket.connected) {
    socket.emit('leaveChat', { chatId });
  }
}

/**
 * Send typing indicator
 */
export function sendTypingIndicator(
  socket: Socket | null,
  chatId: string,
  userName: string
): void {
  if (socket && socket.connected) {
    socket.emit('userTyping', { chatId, userName });
  }
}

/**
 * Mark message(s) as read
 */
export function markMessagesAsRead(
  socket: Socket | null,
  chatId: string,
  messageIds: string[]
): void {
  if (socket && socket.connected && messageIds.length > 0) {
    socket.emit('messageRead', {
      chatId,
      messageIds,
    });
  }
}

/**
 * Send presence ping
 */
export function sendPresencePing(
  socket: Socket | null,
  status?: 'online' | 'away' | 'busy'
): void {
  if (socket && socket.connected) {
    socket.emit('presencePing', { status });
  }
}

/**
 * React hook for chat room events
 */
export function useChatSocket(
  socket: Socket | null,
  chatId: string | null,
  options?: {
    onTyping?: (users: Array<{ userId: string; userName: string }>) => void;
    onStoppedTyping?: (userId: string) => void;
    onMessageRead?: (data: {
      chatId: string;
      messageIds: string[];
      readBy: string;
      timestamp: string;
    }) => void;
  }
) {
  const { onTyping, onStoppedTyping, onMessageRead } = options || {};

  useEffect(() => {
    if (!socket || !socket.connected || !chatId) return;

    // Join chat room
    joinChat(socket, chatId).catch((error) => {
      console.error('Failed to join chat:', error);
    });

    // Typing indicator handlers
    const handleTyping = (data: {
      chatId: string;
      users: Array<{ userId: string; userName: string }>;
    }) => {
      if (data.chatId === chatId && onTyping) {
        onTyping(data.users);
      }
    };

    const handleStoppedTyping = (data: { chatId: string; userId: string }) => {
      if (data.chatId === chatId && onStoppedTyping) {
        onStoppedTyping(data.userId);
      }
    };

    // Message read handler
    const handleMessageRead = (data: {
      chatId: string;
      messageIds: string[];
      readBy: string;
      timestamp: string;
    }) => {
      if (data.chatId === chatId && onMessageRead) {
        onMessageRead(data);
      }
    };

    socket.on('userTyping', handleTyping);
    socket.on('userStoppedTyping', handleStoppedTyping);
    socket.on('messageRead', handleMessageRead);

    // Cleanup
    return () => {
      socket.off('userTyping', handleTyping);
      socket.off('userStoppedTyping', handleStoppedTyping);
      socket.off('messageRead', handleMessageRead);
      
      if (chatId) {
        leaveChat(socket, chatId);
      }
    };
  }, [socket, chatId, onTyping, onStoppedTyping, onMessageRead]);
}

