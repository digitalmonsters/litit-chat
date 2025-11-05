'use client';

/**
 * Call Screen Component
 * 
 * Video/audio call interface using 100ms React SDK with Snap Camera Kit integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow } from '@/lib/flame-transitions';
import SelfPreview from './SelfPreview';
import type { FirestoreCall } from '@/lib/firestore-collections';
import { 
  useHMSStore, 
  useHMSActions, 
  selectPeers, 
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  HMSRoomProvider,
} from '@100mslive/react-sdk';

export interface CallScreenProps {
  callId: string; // Firestore call document ID
  onEndCall?: () => void;
  className?: string;
}

function CallScreenInner({
  callId,
  onEndCall,
  className,
}: CallScreenProps) {
  const [call, setCall] = useState<FirestoreCall | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapFiltersEnabled, setSnapFiltersEnabled] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);
  
  const hmsActions = useHMSActions();
  const peers = useHMSStore(selectPeers);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const localPeer = useHMSStore(selectLocalPeer);
  const isLocalAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(localPeer?.id));
  const isLocalVideoEnabled = useHMSStore(selectIsPeerVideoEnabled(localPeer?.id));

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
          
          // Track call start time for billing
          if (callData.status === 'active' && callData.startedAt && !callStartTime) {
            setCallStartTime(callData.startedAt.toDate());
          }
        }
      },
      (err) => {
        console.error('Error fetching call:', err);
        setError('Failed to load call data');
      }
    );

    return () => unsubscribe();
  }, [callId, callStartTime]);

  // Update duration counter
  useEffect(() => {
    if (!callStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const durationMs = now.getTime() - callStartTime.getTime();
      setDuration(Math.floor(durationMs / 1000)); // Duration in seconds
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  // Get HMS token and join room
  useEffect(() => {
    if (!call?.id) return;

    const fetchTokenAndJoin = async () => {
      try {
        // Get token from API
        const response = await fetch('/api/call/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callId: call.id,
            role: 'guest', // Default role
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get call token');
        }

        const data = await response.json();
        setToken(data.token);

        // Join HMS room
        await hmsActions.join({
          authToken: data.token,
          userName: localPeer?.name || 'User',
          settings: {
            isAudioMuted: false,
            isVideoMuted: false,
          },
        });

        console.log('✅ Joined 100ms room:', call.roomId);
      } catch (err) {
        console.error('Error joining call:', err);
        setError(err instanceof Error ? err.message : 'Failed to join call');
      }
    };

    fetchTokenAndJoin();
  }, [call?.id, call?.roomId, hmsActions]);

  // Initialize Snap Camera Kit (staging mode)
  useEffect(() => {
    if (!snapFiltersEnabled || !localVideoRef.current) return;

    const initSnapCamera = async () => {
      try {
        const { initializeSnapCameraKit, applySnapFilter } = await import('@/lib/snap-camera-kit');
        
        const apiToken = process.env.NEXT_PUBLIC_SNAP_API_TOKEN || '';
        
        if (!apiToken) {
          console.warn('⚠️ Snap API token not configured');
          return;
        }
        
        const session = await initializeSnapCameraKit({
          apiToken,
          stage: true,
        });
        
        if (session && localVideoRef.current) {
          // Apply default lens (first available lens)
          await applySnapFilter(localVideoRef.current, 'lens-1');
        }
        
        console.log('📸 Snap Camera Kit initialized (staging)');
      } catch (err) {
        console.error('Error initializing Snap Camera Kit:', err);
      }
    };

    initSnapCamera();
  }, [snapFiltersEnabled]);

  const toggleMute = async () => {
    await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
  };

  const toggleSnapFilters = () => {
    setSnapFiltersEnabled(!snapFiltersEnabled);
  };

  const handleEndCall = async () => {
    try {
      // Leave HMS room
      await hmsActions.leave();

      // End call and process billing
      const response = await fetch('/api/call/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: call?.id,
          status: 'ended',
        }),
      });

      if (!response.ok) {
        console.error('Failed to process call billing');
      }

      const billingData = await response.json();
      console.log('✅ Call ended:', billingData);

      onEndCall?.();
    } catch (err) {
      console.error('Error ending call:', err);
      onEndCall?.();
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get remote peers (filter out local peer)
  const remotePeers = peers.filter(peer => peer.id !== localPeer?.id);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('relative w-full h-full bg-black rounded-2xl overflow-hidden', className)}
    >
      {/* Remote Video */}
      <div className="relative w-full h-full">
        {remotePeers.length > 0 ? (
          <div className="w-full h-full grid grid-cols-1 gap-2">
            {remotePeers.map((peer) => (
              <div key={peer.id} className="relative w-full h-full">
                <video
                  ref={(el) => {
                    if (el && peer.videoTrack) {
                      hmsActions.attachVideo(peer.videoTrack, el);
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
                  {peer.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-400">Waiting for others to join...</p>
            </div>
          </div>
        )}

        {/* Self Preview */}
        <div className="absolute bottom-4 right-4 w-32 h-48 rounded-xl overflow-hidden border-2 border-[#FF5E3A]">
          <SelfPreview
            ref={(el) => {
              localVideoRef.current = el;
              if (el && localPeer?.videoTrack) {
                hmsActions.attachVideo(localPeer.videoTrack, el);
              }
            }}
            isMuted={!isLocalAudioEnabled}
            isVideoOff={!isLocalVideoEnabled}
          />
        </div>

        {/* Call Duration & Billing Info */}
        {isConnected && callStartTime && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg text-white"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono">{formatDuration(duration)}</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {Math.ceil(duration / 60)} min • ~{Math.ceil(duration / 60) * (call?.ratePerMinute || 10)} ⭐
            </div>
          </motion.div>
        )}

        {/* Connection Status */}
        {!isConnected && !error && (
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
              !isLocalAudioEnabled
                ? 'bg-red-500'
                : 'bg-gray-800/80 backdrop-blur-sm'
            )}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {!isLocalAudioEnabled ? (
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
              !isLocalVideoEnabled
                ? 'bg-red-500'
                : 'bg-gray-800/80 backdrop-blur-sm'
            )}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {!isLocalVideoEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </motion.button>

          {/* Snap AR Filters Toggle */}
          <motion.button
            onClick={toggleSnapFilters}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              snapFiltersEnabled
                ? 'bg-[#FF5E3A]'
                : 'bg-gray-800/80 backdrop-blur-sm'
            )}
            title="Snap AR Filters"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

// Wrap with HMSRoomProvider
export default function CallScreen(props: CallScreenProps) {
  return (
    <HMSRoomProvider>
      <CallScreenInner {...props} />
    </HMSRoomProvider>
  );
}
