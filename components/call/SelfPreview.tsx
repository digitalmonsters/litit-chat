'use client';

/**
 * Self Preview Component
 * 
 * Shows local video preview for calls
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { flameFadeIn } from '@/lib/flame-transitions';

export interface SelfPreviewProps {
  stream?: MediaStream | null;
  muted?: boolean;
  className?: string;
}

export default function SelfPreview({
  stream,
  muted = true,
  className,
}: SelfPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('relative rounded-xl overflow-hidden bg-gray-900', className)}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Connecting...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

