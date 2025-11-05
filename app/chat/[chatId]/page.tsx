'use client';

/**
 * Chat Page
 * 
 * Main chat interface with ChatList and Conversation
 */

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ChatList from '@/components/chat/ChatList';
import Conversation from '@/components/chat/Conversation';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { flameFadeIn } from '@/lib/flame-transitions';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const chatId = params?.chatId as string | undefined;
  const [showChatList, setShowChatList] = useState(!chatId);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ResponsiveLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={flameFadeIn}
        className="h-full flex bg-[#1E1E1E]"
      >
        {/* Chat List - Desktop always visible, mobile toggle */}
        <div
          className={cn(
            'w-full md:w-80 border-r border-gray-800 flex-shrink-0',
            'transition-all duration-300',
            chatId && 'hidden md:block'
          )}
        >
          <ChatList
            onChatSelect={(selectedChatId) => {
              router.push(`/chat/${selectedChatId}`);
              setShowChatList(false);
            }}
            selectedChatId={chatId}
          />
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          {chatId ? (
            <Conversation chatId={chatId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-400">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </ResponsiveLayout>
  );
}

