'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

export interface SplashProps {
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

/**
 * Splash Screen Component
 * 
 * Displays ghost-flame Lottie animation with fade transition
 */
export default function Splash({
  onComplete,
  duration = 2500,
  className,
}: SplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animationLoaded, setAnimationLoaded] = useState(false);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    // Load Lottie animation
    fetch('/lottie/loader.json')
      .then((res) => res.json())
      .then((data) => {
        setAnimationData(data);
        setAnimationLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Lottie animation:', err);
        setAnimationLoaded(true); // Continue even if animation fails
      });

    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500); // Wait for fade out animation
    }, duration);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E1E]',
            className
          )}
        >
          {/* Flame Animation Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: animationLoaded ? 1 : 0.8,
              opacity: animationLoaded ? 1 : 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            {/* Lottie Animation */}
            {animationData && (
              <div className="w-64 h-64 md:w-80 md:h-80">
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(255, 94, 58, 0.6))',
                  }}
                />
              </div>
            )}

            {/* Animated Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-full -z-10"
              style={{
                background: 'radial-gradient(circle, rgba(255, 94, 58, 0.4) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Pulse Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: 'rgba(255, 94, 58, 0.3)',
                }}
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animationLoaded ? 1 : 0, y: animationLoaded ? 0 : 20 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="absolute bottom-20 left-0 right-0 text-center"
          >
            <p className="text-sm font-medium text-[#FF9E57] bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent">
              Lit.it
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

