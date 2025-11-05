'use client';

/**
 * Chat List Component
 * 
 * Shows list of conversations with last messages and unread badges
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameStagger, flameStaggerItem } from '@/lib/flame-transitions';
import type { FirestoreChat, FirestoreMessage } from '@/lib/firestore-collections';

export interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
  className?: string;
}

interface ChatListItem extends FirestoreChat {
  lastMessage?: FirestoreMessage;
  unreadCount: number;
}

export default function ChatList({
  onChatSelect,
  selectedChatId,
  className,
}: ChatListProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const db = getFirestoreInstance();
    const chatsRef = collection(db, COLLECTIONS.CHATS);

    // Query chats where user is a participant
    const q = query(
      chatsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatsData: ChatListItem[] = [];

        for (const docSnap of snapshot.docs) {
          const chatData = { id: docSnap.id, ...docSnap.data() } as FirestoreChat;
          
          // Get unread count for current user
          const unreadCount = chatData.unreadCounts?.[user.uid] || 0;

          // Get last message if available
          let lastMessage: FirestoreMessage | undefined;
          if (chatData.lastMessageId) {
            try {
              const { doc, getDoc } = await import('firebase/firestore');
              const messageRef = doc(
                db,
                `${COLLECTIONS.CHATS}/${chatData.id}/${COLLECTIONS.MESSAGES}`,
                chatData.lastMessageId
              );
              const messageSnap = await getDoc(messageRef);
              if (messageSnap.exists()) {
                lastMessage = {
                  id: messageSnap.id,
                  ...messageSnap.data(),
                } as FirestoreMessage;
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Failed to fetch last message:', error);
            }
          }

          chatsData.push({
            ...chatData,
            lastMessage,
            unreadCount,
          });
        }

        setChats(chatsData);
        setLoading(false);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching chats:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="w-8 h-8 border-2 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={flameFadeIn}
        className={cn('flex flex-col items-center justify-center h-full p-8 text-center', className)}
      >
        <div className="text-6xl mb-4">💬</div>
        <p className="text-gray-400">No conversations yet</p>
        <p className="text-sm text-gray-500 mt-2">Start a new chat to get started</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameStagger}
      className={cn('flex flex-col h-full overflow-y-auto', className)}
    >
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={chat.id === selectedChatId}
          onClick={() => onChatSelect(chat.id)}
        />
      ))}
    </motion.div>
  );
}

interface ChatListItemProps {
  chat: ChatListItem;
  isSelected: boolean;
  onClick: () => void;
}

function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
  const { user } = useAuth();
  const otherParticipant = chat.participantIds?.find((id) => id !== user?.uid);
  const participantName = chat.name ?? 'Unknown';

  const participantAvatar = chat.avatar;

  const formatTime = (timestamp?: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const lastMessageText = chat.lastMessage
    ? chat.lastMessage.type === 'image'
      ? '📷 Photo'
      : chat.lastMessage.type === 'video'
      ? '🎥 Video'
      : chat.lastMessage.type === 'audio'
      ? '🎵 Audio'
      : chat.lastMessage.type === 'file'
      ? '📎 File'
      : chat.lastMessage.content ?? ''
    : 'No messages yet';

  return (
    <motion.div
      variants={flameStaggerItem}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 cursor-pointer',
        'hover:bg-gray-800/50 transition-colors',
        'border-b border-gray-800',
        isSelected && 'bg-gray-800/70 border-l-4 border-l-[#FF5E3A]'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {participantAvatar ? (
          <img
            src={participantAvatar}
            alt={participantName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center">
            <span className="text-white font-semibold">
              {participantName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
        )}

        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1E1E1E]" />
      </div>

      {/* Chat info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white truncate">{participantName}</h3>
          {chat.lastMessageAt && (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTime(chat.lastMessageAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 truncate">{lastMessageText}</p>
          {chat.unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 ml-2 w-5 h-5 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-full flex items-center justify-center"
            >
              <span className="text-xs font-semibold text-white">
                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

