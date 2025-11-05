'use client';

/**
 * Live Party Screen Component
 * 
 * Live streaming interface with host/viewer views, comments, live chat, tipping bar
 * Supports side-by-side "Battle Mode" layout with two creators
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { flameFadeIn } from '@/lib/flame-transitions';
import TipModal from '@/components/tip/TipModal';
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import type { FirestoreUser } from '@/lib/firestore-collections';
import { useAuth } from '@/contexts/AuthContext';

export interface LivePartyScreenProps {
  livestreamId: string; // Firestore livestreams/{id} document ID
  isHost?: boolean;
  className?: string;
}

export default function LivePartyScreen({
  livestreamId,
  isHost = false,
  className,
}: LivePartyScreenProps) {
  const { user } = useAuth();
  const [livestream, setLivestream] = useState<{
    id: string;
    hostId: string;
    battleHostId?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    viewerCount: number;
    isBattleMode: boolean;
    [key: string]: unknown;
  } | null>(null);
  const [comments, setComments] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    message: string;
    timestamp: Date;
    isTip?: boolean;
    tipAmount?: number;
  }>>([]);
  const [newComment, setNewComment] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Read livestream data from Firestore livestreams/{id}
  useEffect(() => {
    if (!livestreamId) return;

    const db = getFirestoreInstance();
    const livestreamRef = doc(db, COLLECTIONS.LIVESTREAMS, livestreamId);

    const unsubscribe = onSnapshot(
      livestreamRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setLivestream({
            id: snapshot.id,
            hostId: data?.hostId ?? '',
            battleHostId: data?.battleHostId,
            status: data?.status ?? 'scheduled',
            viewerCount: data?.viewerCount ?? 0,
            isBattleMode: data?.isBattleMode ?? false,
            ...data,
          });
        }
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching livestream:', err);
      }
    );

    return () => unsubscribe();
  }, [livestreamId]);

  // Read comments from livestreams/{id}/comments subcollection
  useEffect(() => {
    if (!livestreamId) return;

    const db = getFirestoreInstance();
    const commentsRef = collection(db, `${COLLECTIONS.LIVESTREAMS}/${livestreamId}/comments`);
    const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data?.userId ?? '',
          userName: data?.userName ?? 'Anonymous',
          userAvatar: data?.userAvatar,
          message: data?.message ?? '',
          timestamp: data?.timestamp?.toDate() ?? new Date(),
          isTip: data?.isTip,
          tipAmount: data?.tipAmount,
        };
      });
      setComments(commentsData.reverse()); // Reverse to show oldest first
    });

    return () => unsubscribe();
  }, [livestreamId]);

  // Scroll to bottom of comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !user || !livestreamId) return;

    try {
      const db = getFirestoreInstance();
      const commentsRef = collection(db, `${COLLECTIONS.LIVESTREAMS}/${livestreamId}/comments`);
      
      await addDoc(commentsRef, {
        userId: user.uid,
        userName: user.displayName ?? 'Anonymous',
        userAvatar: user.photoURL ?? undefined,
        message: newComment,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      setNewComment('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error sending comment:', err);
    }
  };

  const handleTip = (userId: string) => {
    setSelectedUserId(userId);
    setShowTipModal(true);
  };

  const handleTipSuccess = async (amount: number, recipientId: string) => {
    if (!user || !livestreamId) return;

    try {
      const db = getFirestoreInstance();
      const commentsRef = collection(db, `${COLLECTIONS.LIVESTREAMS}/${livestreamId}/comments`);
      
      await addDoc(commentsRef, {
        userId: user.uid,
        userName: user.displayName ?? 'Anonymous',
        userAvatar: user.photoURL ?? undefined,
        message: `💫 Tipped $${(amount / 100).toFixed(2)}!`,
        isTip: true,
        tipAmount: amount,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      setShowTipModal(false);
      setSelectedUserId(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error adding tip comment:', err);
    }
  };

  return (
    <div className={cn('relative w-full h-full bg-black', className)}>
      {/* Video Streams */}
      <div className={cn(
        'relative w-full h-full',
        livestream?.isBattleMode ? 'grid grid-cols-2' : 'flex'
      )}>
        {/* Host Stream */}
        <div className="relative flex-1 bg-gray-900">
          <video
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {livestream?.status === 'live' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500/80 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-semibold">LIVE</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
            <span className="text-white text-sm">👁️ {livestream?.viewerCount || 0} viewers</span>
          </div>
        </div>

        {/* Battle Mode: Second Host */}
        {livestream?.isBattleMode && livestream?.battleHostId && (
          <div className="relative flex-1 bg-gray-900 border-l-2 border-[#FF5E3A]">
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {livestream?.status === 'live' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500/80 backdrop-blur-sm rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-semibold">LIVE</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-80 bg-black/80 backdrop-blur-sm border-l border-gray-800 flex flex-col">
        {/* Comments Header */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">Live Chat</h3>
          <p className="text-gray-400 text-xs">{livestream?.viewerCount || 0} viewers</p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'flex items-start gap-2',
                  comment.isTip && 'bg-gradient-to-r from-[#FF5E3A]/20 to-[#FF9E57]/20 rounded-lg p-2'
                )}
              >
                {comment.userAvatar ? (
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">
                      {comment.userName?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{comment.userName}</span>
                    {comment.isTip && (
                      <span className="text-xs text-[#FF9E57]">⭐</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 break-words">{comment.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendComment();
                }
              }}
              placeholder="Type a comment..."
              className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]"
            />
            <motion.button
              onClick={handleSendComment}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-lg text-white text-sm font-semibold"
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tipping Bar */}
      <div className="absolute bottom-4 left-4 right-4 md:right-96 flex items-center gap-2">
        {livestream?.hostId && (
          <motion.button
            onClick={() => handleTip(livestream.hostId)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-lg text-white font-semibold flex items-center gap-2"
          >
            <span>⭐</span>
            <span>Tip</span>
          </motion.button>
        )}
        {livestream?.isBattleMode && livestream?.battleHostId && (
          <motion.button
            onClick={() => handleTip(livestream.battleHostId ?? '')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] rounded-lg text-white font-semibold flex items-center gap-2"
          >
            <span>⭐</span>
            <span>Tip</span>
          </motion.button>
        )}
      </div>

      {/* Tip Modal */}
      {showTipModal && selectedUserId && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => {
            setShowTipModal(false);
            setSelectedUserId(null);
          }}
          recipientId={selectedUserId}
          onSuccess={(amount) => handleTipSuccess(amount, selectedUserId ?? '')}
        />
      )}
    </div>
  );
}
