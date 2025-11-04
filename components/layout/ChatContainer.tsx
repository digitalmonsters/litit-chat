'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatRoom, Message, User } from '@/types/chat';
import Header from './Header';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import Sidebar from './Sidebar';

export interface ChatContainerProps {
  rooms: ChatRoom[];
  currentRoom?: ChatRoom | null;
  messages: Message[];
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
  const currentRoomMessages = currentRoom
    ? messages.filter((msg) => msg.senderId || true) // Filter by room if needed
    : [];

  return (
    <div
      className={cn(
        'flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950',
        className
      )}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 flex-shrink-0">
          <Sidebar
            rooms={rooms}
            currentRoomId={currentRoom?.id}
            onRoomSelect={onRoomSelect}
            onNewChat={onNewChat}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          room={currentRoom}
          currentUser={currentUser}
          isConnected={isConnected}
          onSettingsClick={onSettingsClick}
          onProfileClick={onProfileClick}
        />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {currentRoom ? (
            <MessageList
              messages={currentRoomMessages}
              currentUserId={currentUser.id}
              isTyping={isTyping}
              typingUser={typingUser}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-500 dark:text-zinc-400">
                  Select a chat to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        {currentRoom && (
          <MessageInput
            onSend={onSendMessage}
            disabled={!isConnected}
            placeholder={
              isConnected
                ? 'Type a message...'
                : 'Connecting...'
            }
          />
        )}
      </div>
    </div>
  );
}




