'use client';

/**
 * Chat Page
 * 
 * Snapchat-style chat interface with Discover sidebar, ChatList, and Conversation
 */

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ChatList from '@/components/chat/ChatList';
import Conversation from '@/components/chat/Conversation';
import DiscoverSidebar from '@/components/chat/DiscoverSidebar';
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
        {/* Discover Sidebar - Desktop left, Mobile bottom nav */}
        <div
          className={cn(
            'border-r border-gray-800 flex-shrink-0 overflow-y-auto',
            'hidden lg:block lg:w-72',
            chatId && 'hidden lg:block'
          )}
        >
          <DiscoverSidebar />
        </div>

        {/* Chat List - Desktop center-left, Mobile toggle */}
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

        {/* Conversation - Right side */}
        <div className="flex-1 flex flex-col min-w-0">
          {chatId ? (
            <Conversation chatId={chatId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-400">Select a conversation to start chatting</p>
                <p className="text-sm text-gray-500 mt-2">or discover AI companions on the left</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile bottom navigation for Discover */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden border-t border-gray-800 bg-[#1E1E1E] z-40">
          <div className="flex items-center justify-around p-2">
            <button
              onClick={() => router.push('/chat')}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                !chatId ? 'text-[#FF5E3A]' : 'text-gray-400'
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">Chats</span>
            </button>
            <button
              onClick={() => router.push('/discover')}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs font-medium">Discover</span>
            </button>
            <button
              onClick={() => router.push('/match')}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs font-medium">Match</span>
            </button>
          </div>
        </div>
      </motion.div>
    </ResponsiveLayout>
  );
}

