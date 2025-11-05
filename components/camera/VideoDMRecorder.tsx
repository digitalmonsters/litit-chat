'use client';

/**
 * Video DM Recorder Component
 * 
 * Uses Snap Camera Kit for recording with lenses
 * Records, previews, re-records, and uploads to Firebase Storage
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameGlow } from '@/lib/flame-transitions';
import { uploadChatImage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoDMRecorderProps {
  chatId: string;
  onUploadComplete?: (url: string) => void;
  onClose?: () => void;
  className?: string;
}

let cameraKit: any = null;
let camera: any = null;
let recorder: any = null;

export default function VideoDMRecorder({
  chatId,
  onUploadComplete,
  onClose,
  className,
}: VideoDMRecorderProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Camera Kit
  useEffect(() => {
    async function initCameraKit() {
      try {
        if (typeof window === 'undefined') return;

        // Dynamically import Snap Camera Kit
        const { bootstrapCameraKit } = await import('@snap/camera-kit');
        
        const apiToken = process.env.NEXT_PUBLIC_SNAP_API_TOKEN_STAGING;
        if (!apiToken) {
          throw new Error('SNAP_API_TOKEN_STAGING not configured');
        }

        cameraKit = await bootstrapCameraKit({
          apiToken,
        });

        // Load lens groups
        const lensGroupId = process.env.NEXT_PUBLIC_SNAP_LENS_GROUP;
        if (lensGroupId) {
          const lensGroups = await cameraKit.loadLensGroups([lensGroupId]);
          // eslint-disable-next-line no-console
          console.log('Lens groups loaded:', lensGroups);
        }

        // Create camera
        camera = await cameraKit.createCamera({
          source: {
            type: 'user-facing',
          },
        });

        // Attach to video element
        if (videoRef.current) {
          await camera.attach(videoRef.current);
          setLoading(false);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error initializing Camera Kit:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize camera');
        setLoading(false);
      }
    }

    initCameraKit();

    // Cleanup
    return () => {
      if (recorder) {
        recorder.stop();
      }
      if (camera) {
        camera.dispose();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (!camera) return;

    try {
      setError(null);
      recorder = await camera.createRecorder();
      await recorder.start();
      setRecording(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recorder) return;

    try {
      const blob = await recorder.stop();
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setRecording(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error stopping recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  const handleReRecord = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleUpload = async () => {
    if (!recordedBlob || !user) return;

    setUploading(true);
    setError(null);

    try {
      // Create file from blob
      const file = new File([recordedBlob], `video-${Date.now()}.mp4`, {
        type: 'video/mp4',
      });

      // Upload to Firebase Storage
      const url = await uploadChatImage(chatId, file);
      
      onUploadComplete?.(url);
      
      // Cleanup
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error uploading video:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#FF5E3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Initializing camera...</p>
        </div>
      </div>
    );
  }

  if (error && !camera) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center p-6">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('relative w-full h-full bg-[#1E1E1E]', className)}
    >
      {/* Video Preview */}
      {!previewUrl ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Recording Indicator */}
          {recording && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full"
            >
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-white text-sm font-semibold">Recording</span>
            </motion.div>
          )}

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {!recording ? (
              <motion.button
                onClick={handleStartRecording}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStopRecording}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </motion.button>
            )}

            {onClose && (
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-gray-800/80 rounded-full flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="relative w-full h-full">
          <video
            src={previewUrl}
            controls
            className="w-full h-full object-cover"
          />

          {/* Preview Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <motion.button
              onClick={handleReRecord}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold"
            >
              Re-record
            </motion.button>
            <motion.button
              onClick={handleUpload}
              disabled={uploading}
              whileHover={{ scale: uploading ? 1 : 1.1 }}
              whileTap={{ scale: uploading ? 1 : 0.9 }}
              className="px-6 py-3 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 px-4 py-3 bg-red-500/90 text-white rounded-lg max-w-xs"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

