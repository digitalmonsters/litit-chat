'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function MessageInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div
      className={cn(
        'flex items-end gap-2 border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
    >
      <div className="flex flex-1 items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'max-h-32 flex-1 resize-none rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
          )}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
            message.trim() && !disabled
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-700'
          )}
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}





