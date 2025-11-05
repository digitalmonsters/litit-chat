'use client';

/**
 * Call Screen Component
 * 
 * Video/audio call interface using 100ms React SDK
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow } from '@/lib/flame-transitions';
import SelfPreview from './SelfPreview';
import type { FirestoreCall } from '@/lib/firestore-collections';

export interface CallScreenProps {
  callId: string; // Firestore call document ID
  onEndCall?: () => void;
  className?: string;
}

export default function CallScreen({
  callId,
  onEndCall,
  className,
}: CallScreenProps) {
  const [call, setCall] = useState<FirestoreCall | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Read call data from Firestore calls/{id}
  useEffect(() => {
    if (!callId) return;

    const db = getFirestoreInstance();
    const callRef = doc(db, COLLECTIONS.CALLS, callId);

    const unsubscribe = onSnapshot(
      callRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const callData = { id: snapshot.id, ...snapshot.data() } as FirestoreCall;
          setCall(callData);
        }
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching call:', err);
        setError('Failed to load call data');
      }
    );

    return () => unsubscribe();
  }, [callId]);

  useEffect(() => {
    if (!call?.roomId) return;

    // Initialize 100ms SDK with roomId from call document
    const initialize100ms = async () => {
      try {
        // Dynamically import 100ms SDK
        const HMS = await import('@100mslive/react-sdk');
        
        // TODO: Initialize 100ms room with token
        // const hms = await HMS.HMSRoomProvider({
        //   roomId: call.roomId,
        //   token: process.env.NEXT_PUBLIC_100MS_TOKEN,
        // });

        setIsConnected(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error initializing 100ms:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect');
      }
    };

    initialize100ms();
  }, [call?.roomId]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Toggle audio via 100ms SDK
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // TODO: Toggle video via 100ms SDK
  };

  const handleEndCall = () => {
    // TODO: Leave 100ms room
    onEndCall?.();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('relative w-full h-full bg-black rounded-2xl overflow-hidden', className)}
    >
      {/* Remote Video */}
      <div className="relative w-full h-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Self Preview */}
        <div className="absolute bottom-4 right-4 w-32 h-48 rounded-xl overflow-hidden border-2 border-[#FF5E3A]">
          <SelfPreview
            ref={localVideoRef}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
          />
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-[#FF5E3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Connecting...</p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-4 px-4 py-3 bg-red-500/80 backdrop-blur-sm rounded-lg text-white"
          >
            {error}
          </motion.div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
          {/* Mute Toggle */}
          <motion.button
            onClick={toggleMute}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isMuted
                ? 'bg-red-500'
                : 'bg-gray-800/80 backdrop-blur-sm'
            )}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </motion.button>

          {/* Video Toggle */}
          <motion.button
            onClick={toggleVideo}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isVideoOff
                ? 'bg-red-500'
                : 'bg-gray-800/80 backdrop-blur-sm'
            )}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </motion.button>

          {/* End Call */}
          <motion.button
            onClick={handleEndCall}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
