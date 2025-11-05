'use client';

/**
 * Chat With Realtime Component
 * 
 * Connects Firestore onSnapshot listeners for messages and users presence
 * Wraps ChatContainer with real-time data
 */

import React, { useEffect, useState } from 'react';
import { useRealtimeMessages } from '@/lib/realtime-messages';
import { useUsersPresence } from '@/lib/realtime-users';
import { useAuth } from '@/contexts/AuthContext';
import ChatContainer from '../layout/ChatContainer';
import type { ChatRoom, User } from '@/types/chat';
import type { FirestoreMessage } from '@/lib/firestore-collections';

export interface ChatWithRealtimeProps {
  chatId: string;
  rooms: ChatRoom[];
  currentRoom?: ChatRoom | null;
  onRoomSelect: (roomId: string) => void;
  onNewChat?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  showSidebar?: boolean;
  className?: string;
}

export default function ChatWithRealtime({
  chatId,
  rooms,
  currentRoom,
  onRoomSelect,
  onNewChat,
  onSettingsClick,
  onProfileClick,
  showSidebar = true,
  className,
}: ChatWithRealtimeProps) {
  const { user } = useAuth();
  const [allMessages, setAllMessages] = useState<FirestoreMessage[]>([]);

  // Listen to messages for current chat
  const {
    messages: currentMessages,
    loading: messagesLoading,
    error: messagesError,
  } = useRealtimeMessages({
    chatId: currentRoom?.id || chatId,
    limitCount: 50,
    enablePushNotifications: true,
  });

  // Listen to users presence
  const {
    users: onlineUsers,
    loading: usersLoading,
    error: usersError,
  } = useUsersPresence({
    filter: 'online',
    limitCount: 100,
    verifiedOnly: true,
  });

  // Update all messages when current messages change
  useEffect(() => {
    if (currentMessages.length > 0) {
      setAllMessages((prev) => {
        // Merge messages, avoiding duplicates
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = currentMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMessages].sort((a, b) => {
          const aTime = a.timestamp?.toMillis?.() || 0;
          const bTime = b.timestamp?.toMillis?.() || 0;
          return aTime - bTime;
        });
      });
    }
  }, [currentMessages]);

  // Build current user object
  const currentUser: User = {
    id: user?.uid || '',
    name: user?.displayName || 'User',
    avatar: user?.photoURL || undefined,
    status: 'online',
  };

  // Build users map from online users
  const usersMap: Record<string, User> = {};
  onlineUsers.forEach((u) => {
    usersMap[u.id] = {
      id: u.id,
      name: u.displayName || u.email || 'User',
      avatar: u.photoURL || undefined,
      status: 'online',
    };
  });

  // Get messages for current room
  const roomMessages = currentRoom
    ? allMessages.filter((msg) => msg.chatId === currentRoom.id)
    : [];

  const handleSendMessage = async (message: string) => {
    // This should be handled by MessageInput component
    // which will call the API to send the message
    console.log('Sending message:', message);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E1E1E]">
        <div className="text-center">
          <p className="text-zinc-400">Please log in to use chat</p>
        </div>
      </div>
    );
  }

  return (
    <ChatContainer
      rooms={rooms}
      currentRoom={currentRoom}
      messages={roomMessages}
      currentUser={currentUser}
      isConnected={!messagesLoading && !messagesError}
      onSendMessage={handleSendMessage}
      onRoomSelect={onRoomSelect}
      onNewChat={onNewChat}
      onSettingsClick={onSettingsClick}
      onProfileClick={onProfileClick}
      showSidebar={showSidebar}
      className={className}
    />
  );
}

