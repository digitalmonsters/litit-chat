'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChatRoom, User } from '@/types/chat';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import Header from './Header';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import Sidebar from './Sidebar';

export interface ChatContainerProps {
  rooms: ChatRoom[];
  currentRoom?: ChatRoom | null;
  messages: FirestoreMessage[];
  currentUser: User;
  isConnected?: boolean;
  isTyping?: boolean;
  typingUser?: string;
  onSendMessage: (message: string) => void;
  onRoomSelect: (roomId: string) => void;
  onNewChat?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  showSidebar?: boolean;
  className?: string;
}

// Flame transition variants
const flameTransition = {
  initial: { opacity: 0, scale: 0.95, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  },
};

const sidebarVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: '-100%',
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

export default function ChatContainer({
  rooms,
  currentRoom,
  messages,
  currentUser,
  isConnected = false,
  isTyping = false,
  typingUser,
  onSendMessage,
  onRoomSelect,
  onNewChat,
  onSettingsClick,
  onProfileClick,
  showSidebar = true,
  className,
}: ChatContainerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!showSidebar);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentRoomMessages = currentRoom
    ? messages.filter((msg) => msg.chatId === currentRoom.id)
    : [];

  const handleRoomSelect = (roomId: string) => {
    onRoomSelect(roomId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className={cn(
        'flex h-screen w-full overflow-hidden bg-[#1E1E1E]',
        className
      )}
    >
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(showSidebar || sidebarOpen) && (
          <motion.div
            variants={sidebarVariants}
            initial={isMobile ? 'closed' : 'open'}
            animate={sidebarOpen ? 'open' : 'closed'}
            exit="closed"
            className={cn(
              'flex-shrink-0 border-r border-zinc-800/50 bg-[#1E1E1E]',
              isMobile
                ? 'fixed inset-y-0 left-0 z-50 w-80'
                : 'relative w-80'
            )}
          >
            <Sidebar
              rooms={rooms}
              currentRoomId={currentRoom?.id}
              onRoomSelect={handleRoomSelect}
              onNewChat={onNewChat}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <motion.div
        className="flex flex-1 flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Header
            room={currentRoom}
            currentUser={currentUser}
            isConnected={isConnected}
            onSettingsClick={onSettingsClick}
            onProfileClick={onProfileClick}
            onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
          />
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentRoom ? (
              <motion.div
                key={currentRoom.id}
                {...flameTransition}
                className="h-full"
              >
                <MessageList
                  messages={currentRoomMessages}
                  currentUserId={currentUser.id}
                  isTyping={isTyping}
                  typingUser={typingUser}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                {...flameTransition}
                className="flex h-full items-center justify-center"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                  >
                    <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] opacity-20" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-zinc-400"
                  >
                    Select a chat to start messaging
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <AnimatePresence>
          {currentRoom && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <MessageInput
                chatId={currentRoom?.id || ''}
                disabled={!isConnected}
                placeholder={
                  isConnected
                    ? 'Type a message...'
                    : 'Connecting...'
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}






