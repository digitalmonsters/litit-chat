'use client';

/**
 * Push Banner Component
 * 
 * Displays FCM push notifications as in-app banners
 * Uses flame-themed animations
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flameSlideUp } from '@/lib/flame-transitions';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  timestamp: Date;
  onClick?: () => void;
}

export interface PushBannerProps {
  notification: PushNotification | null;
  onDismiss: (id: string) => void;
  duration?: number;
  className?: string;
}

export default function PushBanner({
  notification,
  onDismiss,
  duration = 5000,
  className,
}: PushBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onDismiss(notification.id);
        }, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification, duration, onDismiss]);

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={flameSlideUp}
          className={cn(
            'fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md',
            'z-50 pointer-events-auto',
            className
          )}
          onClick={notification.onClick}
        >
          <div
            className={cn(
              'bg-[#1E1E1E] border border-[#FF5E3A]/30 rounded-xl',
              'shadow-2xl backdrop-blur-sm',
              'p-4 flex items-start gap-3',
              'cursor-pointer hover:border-[#FF5E3A]/50 transition-colors',
              'relative overflow-hidden'
            )}
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
            }}
          >
            {/* Flame accent gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]" />

            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {notification.icon ? (
                <img
                  src={notification.icon}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm mb-1 truncate">
                {notification.title}
              </h4>
              <p className="text-gray-400 text-xs line-clamp-2">
                {notification.body}
              </p>
              {notification.image && (
                <img
                  src={notification.image}
                  alt=""
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                setTimeout(() => {
                  onDismiss(notification.id);
                }, 300);
              }}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

