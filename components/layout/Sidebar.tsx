'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatRoom } from '@/types/chat';
import { formatDate, truncate } from '@/lib/utils';
import Avatar from '../chat/Avatar';

export interface SidebarProps {
  rooms: ChatRoom[];
  currentRoomId?: string;
  onRoomSelect: (roomId: string) => void;
  onNewChat?: () => void;
  className?: string;
}

export default function Sidebar({
  rooms,
  currentRoomId,
  onRoomSelect,
  onNewChat,
  className,
}: SidebarProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Chats
        </h2>
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="New chat"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              No chats yet. Start a new conversation!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rooms.map((room) => {
              const isActive = room.id === currentRoomId;
              const lastMessage = room.lastMessage;
              const hasUnread = (room.unreadCount || 0) > 0;

              return (
                <button
                  key={room.id}
                  onClick={() => onRoomSelect(room.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',
                    isActive && 'bg-zinc-100 dark:bg-zinc-800'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={room.avatar}
                      name={room.name}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {room.name}
                        </h3>
                        {lastMessage && (
                          <span className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                            {formatDate(lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                          {truncate(lastMessage.content, 50)}
                        </p>
                      )}
                      {hasUnread && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}




