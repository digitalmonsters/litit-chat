'use client';

/**
 * Self Preview Component
 * 
 * Shows local video preview with mute/video off indicators
 */

import React, { forwardRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SelfPreviewProps {
  isMuted?: boolean;
  isVideoOff?: boolean;
  className?: string;
}

const SelfPreview = forwardRef<HTMLVideoElement, SelfPreviewProps>(
  ({ isMuted, isVideoOff, className }, ref) => {
    useEffect(() => {
      // Get local video stream
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (ref && 'current' in ref && ref.current) {
            ref.current.srcObject = stream;
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Error accessing camera:', err);
        });
    }, [ref]);

    return (
      <div className={cn('relative w-full h-full bg-gray-900', className)}>
        <video
          ref={ref}
          autoPlay
          muted
          playsInline
          className={cn(
            'w-full h-full object-cover',
            isVideoOff && 'hidden'
          )}
        />

        {/* Video Off Overlay */}
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mute Indicator */}
        {isMuted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </motion.div>
        )}
      </div>
    );
  }
);

SelfPreview.displayName = 'SelfPreview';

export default SelfPreview;
