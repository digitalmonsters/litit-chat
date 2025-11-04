'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export default function TypingIndicator({
  userName,
  className,
}: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2',
        className
      )}
    >
      <div className="flex gap-1 rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-800">
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-zinc-400"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-zinc-400"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-zinc-400"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {userName && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {userName} is typing...
        </span>
      )}
    </div>
  );
}






