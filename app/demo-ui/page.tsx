'use client';

/**
 * UI Demo Page
 * 
 * Showcase of all responsive animated components
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ResponsiveGrid, {
  ResponsiveContainer,
  TwoColumnLayout,
} from '@/components/layout/ResponsiveGrid';
import { AnimatedMessageList } from '@/components/chat';
import { MediaCard, MediaGrid, Button } from '@/components/ui';
import UserJoinLeaveIndicator, { useUserJoinLeave } from '@/components/chat/UserJoinLeaveIndicator';
import { flameTransition } from '@/lib/flame-transitions';
import type { FirestoreMessage } from '@/lib/firestore-collections';
import { Timestamp } from 'firebase/firestore';

export default function DemoUIPage() {
  const { event, showJoinEvent, showLeaveEvent } = useUserJoinLeave();
  const [messages] = useState<FirestoreMessage[]>([
    {
      id: '1',
      chatId: 'demo-chat',
      senderId: 'user1',
      content: 'Hello! Check out this new UI! 🔥',
      timestamp: Timestamp.now(),
      type: 'text',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: '2',
      chatId: 'demo-chat',
      senderId: 'user2',
      content: 'Wow, the animations are smooth!',
      timestamp: Timestamp.now(),
      type: 'text',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ]);

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      <ResponsiveContainer>
        <motion.div
          variants={flameTransition}
          initial="initial"
          animate="animate"
          className="py-8 space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-flame">
              Lit.it UI Showcase
            </h1>
            <p className="text-gray-400 text-lg">
              Responsive animated layout with Framer Motion
            </p>
          </div>

          {/* Responsive Grid Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Responsive Grid</h2>
            <ResponsiveGrid
              columns={{ mobile: 1, tablet: 2, desktop: 3 }}
              gap={4}
            >
              <div className="bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] p-6 rounded-xl">
                <h3 className="text-white font-bold mb-2">Mobile: 1 column</h3>
                <p className="text-white/80 text-sm">Stacks vertically on mobile</p>
              </div>
              <div className="bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] p-6 rounded-xl">
                <h3 className="text-white font-bold mb-2">Tablet: 2 columns</h3>
                <p className="text-white/80 text-sm">Two columns on tablet</p>
              </div>
              <div className="bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] p-6 rounded-xl">
                <h3 className="text-white font-bold mb-2">Desktop: 3 columns</h3>
                <p className="text-white/80 text-sm">Three columns on desktop</p>
              </div>
            </ResponsiveGrid>
          </section>

          {/* Media Cards Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Media Cards (Bunny CDN)</h2>
            <MediaGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }}>
              <MediaCard
                src="https://via.placeholder.com/400x600"
                alt="Portrait"
                type="image"
                aspectRatio="portrait"
              />
              <MediaCard
                src="https://via.placeholder.com/800x450"
                alt="Video"
                type="video"
                aspectRatio="video"
              />
              <MediaCard
                src="https://via.placeholder.com/400x400"
                alt="Square"
                type="image"
                aspectRatio="square"
              />
              <MediaCard
                src="https://via.placeholder.com/400x600"
                alt="Locked"
                type="image"
                locked
                aspectRatio="portrait"
              />
            </MediaGrid>
          </section>

          {/* User Join/Leave Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">User Join/Leave Animations</h2>
            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={() => showJoinEvent('user1', 'Alice', 'https://via.placeholder.com/40')}
              >
                Show Join Event
              </Button>
              <Button
                variant="secondary"
                onClick={() => showLeaveEvent('user2', 'Bob', 'https://via.placeholder.com/40')}
              >
                Show Leave Event
              </Button>
            </div>
          </section>

          {/* Message Animations Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Animated Messages</h2>
            <div className="bg-gray-900 rounded-xl overflow-hidden h-[400px] flex flex-col">
              <AnimatedMessageList
                messages={messages}
                currentUserId="user1"
                showAvatars={true}
                showTimestamps={true}
              />
            </div>
          </section>

          {/* Two Column Layout Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Two Column Layout</h2>
            <div className="h-[400px] bg-gray-900 rounded-xl overflow-hidden">
              <TwoColumnLayout
                sidebar={
                  <div className="p-4 bg-gray-800 h-full">
                    <h3 className="text-white font-bold mb-4">Sidebar</h3>
                    <div className="space-y-2">
                      {['Chat 1', 'Chat 2', 'Chat 3'].map((chat, i) => (
                        <div
                          key={i}
                          className="bg-gray-700 p-3 rounded-lg text-white"
                        >
                          {chat}
                        </div>
                      ))}
                    </div>
                  </div>
                }
                main={
                  <div className="p-4 h-full flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-white font-bold text-xl mb-2">
                        Main Content Area
                      </h3>
                      <p className="text-gray-400">
                        Responsive layout adapts to screen size
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          </section>
        </motion.div>
      </ResponsiveContainer>

      {/* User Join/Leave Indicator */}
      <UserJoinLeaveIndicator event={event} />
    </div>
  );
}
