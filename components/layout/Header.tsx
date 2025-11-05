'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatRoom, User } from '@/types/chat';
import Avatar from '../chat/Avatar';
import ConnectionStatus from '../chat/ConnectionStatus';

export interface HeaderProps {
  room?: ChatRoom | null;
  currentUser?: User | null;
  isConnected?: boolean;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onMenuClick?: () => void;
  className?: string;
}

export default function Header({
  room,
  currentUser,
  isConnected = false,
  onSettingsClick,
  onProfileClick,
  onMenuClick,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between border-b border-zinc-800/50 bg-[#1E1E1E] px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-[#FF9E57] lg:hidden"
            title="Menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        {room ? (
          <>
            <Avatar
              src={room.avatar}
              name={room.name}
              size="md"
            />
            <div>
              <h2 className="font-semibold text-zinc-100">
                {room.name}
              </h2>
              {room.description && (
                <p className="text-xs text-zinc-400">
                  {room.description}
                </p>
              )}
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-semibold text-zinc-100 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent">
              FireChat
            </h2>
            <ConnectionStatus isConnected={isConnected} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-[#FF9E57]"
            title="Settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
        {onProfileClick && currentUser && (
          <button
            onClick={onProfileClick}
            className="rounded-lg transition-colors hover:opacity-80"
            title="Profile"
          >
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              size="md"
              status={currentUser.status}
            />
          </button>
        )}
      </div>
    </header>
  );
}






