'use client';

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Lottie animation data - loaded dynamically
let loaderAnimationData: object | null = null;

export interface FlameLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
  message?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
};

export default function FlameLoader({
  size = 'md',
  className,
  fullScreen = false,
  message,
}: FlameLoaderProps) {
  const [isVisible] = useState(true);
  // Initialize with cached data if available, otherwise null
  const [animationData, setAnimationData] = useState<object | null>(
    () => loaderAnimationData
  );

  useEffect(() => {
    // Only fetch if we don't have cached data
    if (!loaderAnimationData) {
      fetch('/lottie/loader.json')
        .then((res) => res.json())
        .then((data) => {
          loaderAnimationData = data;
          setAnimationData(data);
        })
        .catch((err) => {
          console.error('Failed to load Lottie animation:', err);
        });
    }
    // If cached data exists, it's already set via useState initializer
  }, []);

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E1E]'
    : 'flex items-center justify-center';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(containerClasses, className)}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Flame Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                filter: [
                  'drop-shadow(0 0 10px rgba(255, 94, 58, 0.5))',
                  'drop-shadow(0 0 20px rgba(255, 158, 87, 0.5))',
                  'drop-shadow(0 0 10px rgba(255, 94, 58, 0.5))',
                ],
              }}
              transition={{
                duration: 0.5,
                filter: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                },
              }}
              className={cn(sizeClasses[size], 'relative')}
            >
              {animationData && (
                <Lottie
                  animationData={animationData}
                  loop={true}
                  className="w-full h-full"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(255, 94, 58, 0.6))',
                  }}
                />
              )}
              
              {/* Animated glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 94, 58, 0.3) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            {/* Loading message */}
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-medium text-[#FF9E57]"
              >
                {message}
              </motion.p>
            )}

            {/* Pulse dots */}
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

