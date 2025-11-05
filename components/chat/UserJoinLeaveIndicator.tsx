'use client';

/**
 * User Join/Leave Indicator Component
 * 
 * Shows animated indicators when users join or leave
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flameSlideUp } from '@/lib/flame-transitions';

export interface UserJoinLeaveEvent {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'join' | 'leave';
  timestamp: Date;
}

export interface UserJoinLeaveIndicatorProps {
  event: UserJoinLeaveEvent | null;
  className?: string;
}

/**
 * Animated indicator for user join/leave events
 * Auto-dismisses after 3 seconds
 */
function UserJoinLeaveIndicator({
  event,
  className,
}: UserJoinLeaveIndicatorProps) {
  const isJoin = event?.type === 'join';

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          variants={flameSlideUp}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50',
            'px-4 py-2 rounded-full',
            'flex items-center gap-2',
            'shadow-lg',
            isJoin
              ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white'
              : 'bg-gray-800 text-gray-300',
            className
          )}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          >
            {isJoin ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <UserMinus className="w-5 h-5" />
            )}
          </motion.div>

          {/* Avatar */}
          {event.userAvatar && (
            <motion.img
              src={event.userAvatar}
              alt={event.userName}
              className="w-6 h-6 rounded-full object-cover"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: 0.1,
              }}
            />
          )}

          {/* Text */}
          <motion.p
            className="text-sm font-medium"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isJoin ? (
              <>
                <span className="font-semibold">{event.userName}</span> joined
              </>
            ) : (
              <>
                <span className="font-semibold">{event.userName}</span> left
              </>
            )}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage user join/leave events
 */
export function useUserJoinLeave() {
  const [event, setEvent] = React.useState<UserJoinLeaveEvent | null>(null);

  const showJoinEvent = React.useCallback((userId: string, userName: string, userAvatar?: string) => {
    const newEvent: UserJoinLeaveEvent = {
      id: `join-${userId}-${Date.now()}`,
      userId,
      userName,
      userAvatar,
      type: 'join',
      timestamp: new Date(),
    };
    setEvent(newEvent);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setEvent(null);
    }, 3000);
  }, []);

  const showLeaveEvent = React.useCallback((userId: string, userName: string, userAvatar?: string) => {
    const newEvent: UserJoinLeaveEvent = {
      id: `leave-${userId}-${Date.now()}`,
      userId,
      userName,
      userAvatar,
      type: 'leave',
      timestamp: new Date(),
    };
    setEvent(newEvent);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setEvent(null);
    }, 3000);
  }, []);

  return {
    event,
    showJoinEvent,
    showLeaveEvent,
  };
}

export default UserJoinLeaveIndicator;
