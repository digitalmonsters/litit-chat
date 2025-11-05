'use client';

/**
 * Video DM Recorder Component
 * 
 * Uses Snap Camera Kit for video recording with lenses
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
  onRecordingComplete?: (videoUrl: string) => void;
  onClose?: () => void;
  className?: string;
}

export default function VideoDMRecorder({
  chatId,
  onRecordingComplete,
  onClose,
  className,
}: VideoDMRecorderProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLensGroup, setSelectedLensGroup] = useState<string | null>(null);

  // Initialize Snap Camera Kit
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    const initializeCamera = async () => {
      try {
        // Temporarily disabled Snap Camera Kit due to missing dependency
        // const { bootstrapCameraKit } = await import('@snap/camera-kit');
        console.log('Snap Camera Kit temporarily disabled for build compatibility');

        // Temporarily disabled camera initialization
        // const apiToken = process.env.NEXT_PUBLIC_SNAP_API_TOKEN_STAGING;
        // if (!apiToken) {
        //   throw new Error('Snap Camera Kit API token not configured');
        // }

        // const cameraKit = await bootstrapCameraKit({ apiToken });

        // const lensGroupId = process.env.NEXT_PUBLIC_SNAP_LENS_GROUP;
        // if (lensGroupId) {
        //   await cameraKit.loadLensGroups([lensGroupId]);
        //   setSelectedLensGroup(lensGroupId);
        // }

        // Request camera access
        // const stream = await navigator.mediaDevices.getUserMedia({
        //   video: { facingMode: 'user' },
        //   audio: true,
        // });

        // if (videoRef.current) {
        //   videoRef.current.srcObject = stream;
        //   videoRef.current.play();
        // }

        // setIsInitialized(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error initializing camera:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize camera');
      }
    };

    initializeCamera();

    // Cleanup
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isInitialized]);

  const startRecording = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordingBlob(blob);
        setIsPreviewing(true);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const handleReRecord = () => {
    setRecordingBlob(null);
    setIsPreviewing(false);
    setError(null);
  };

  const handleUpload = async () => {
    if (!recordingBlob || !user) return;

    setUploading(true);
    setError(null);

    try {
      // Upload to Firebase Storage
      const file = new File([recordingBlob], `dm-${Date.now()}.webm`, {
        type: 'video/webm',
      });

      // Note: uploadChatImage is for images, we'll need to create uploadChatVideo
      // For now, using a placeholder
      const videoUrl = await uploadChatImage(chatId, file);
      // TODO: Replace with actual video upload function

      onRecordingComplete?.(videoUrl);
      onClose?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error uploading video:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('relative w-full h-full bg-black rounded-2xl overflow-hidden', className)}
    >
      {/* Camera View */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay Controls */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white text-sm"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Preview/Recording Controls */}
          {isPreviewing && recordingBlob ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <video
                src={URL.createObjectURL(recordingBlob)}
                controls
                autoPlay
                className="w-full max-w-md rounded-lg"
              />

              <div className="flex gap-3">
                <motion.button
                  onClick={handleReRecord}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold"
                >
                  Re-record
                </motion.button>
                <motion.button
                  onClick={handleUpload}
                  disabled={uploading}
                  whileHover={{ scale: uploading ? 1 : 1.05 }}
                  whileTap={{ scale: uploading ? 1 : 0.95 }}
                  className={cn(
                    'px-6 py-3 rounded-xl font-semibold',
                    'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white',
                    uploading && 'opacity-50'
                  )}
                >
                  {uploading ? 'Uploading...' : 'Send'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Recording Button */}
              <motion.button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isInitialized}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  isRecording
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]',
                  !isInitialized && 'opacity-50'
                )}
              >
                {isRecording ? (
                  <div className="w-12 h-12 bg-white rounded-full" />
                ) : (
                  <div className="w-12 h-12 bg-white rounded-full" />
                )}
              </motion.button>

              {isRecording && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="px-4 py-2 bg-red-500/80 backdrop-blur-sm rounded-full text-white text-sm font-semibold"
                >
                  Recording...
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
