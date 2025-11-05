'use client';

/**
 * Message Input Component
 * 
 * Supports text, image, video, audio upload
 * Includes "💰 Set Price to Unlock" toggle for media
 */

import React, { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { uploadChatImage, compressImage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';
import { flameFadeIn } from '@/lib/flame-transitions';
import { sendTypingIndicator } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

// Snap Camera Kit integration (optional)
// Note: Install @snap/camera-kit package for full camera integration
// For now, using standard file input with camera capture

export interface MessageInputProps {
  chatId: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  socket?: Socket | null;
}

export default function MessageInput({
  chatId,
  placeholder = 'Type a message...',
  disabled = false,
  className,
  socket,
}: MessageInputProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState('');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || disabled || !user) return;

    setUploading(true);

    try {
      const db = getFirestoreInstance();
      const messagesRef = collection(
        db,
        `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`
      );

      let attachments: Array<{
        url: string;
        type: string;
        name: string;
        size: number;
      }> = [];

      let messageType: 'text' | 'image' | 'file' = 'text';

      // Handle file upload
      if (selectedFile) {
        if (selectedFile.type.startsWith('image/')) {
          messageType = 'image';
          const compressedImage = await compressImage(selectedFile, 1200, 0.85);
          const imageUrl = await uploadChatImage(chatId, compressedImage);
          attachments.push({
            url: imageUrl,
            type: selectedFile.type,
            name: selectedFile.name,
            size: compressedImage.size,
          });
        } else if (selectedFile.type.startsWith('video/')) {
          messageType = 'file';
          // TODO: Implement video upload
          // For now, treat as file
          attachments.push({
            url: URL.createObjectURL(selectedFile),
            type: selectedFile.type,
            name: selectedFile.name,
            size: selectedFile.size,
          });
        } else if (selectedFile.type.startsWith('audio/')) {
          messageType = 'file';
          // TODO: Implement audio upload
          attachments.push({
            url: URL.createObjectURL(selectedFile),
            type: selectedFile.type,
            name: selectedFile.name,
            size: selectedFile.size,
          });
        } else {
          messageType = 'file';
          attachments.push({
            url: URL.createObjectURL(selectedFile),
            type: selectedFile.type,
            name: selectedFile.name,
            size: selectedFile.size,
          });
        }
      }

      // Create message
      const messageData = {
        chatId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderAvatar: user.photoURL || undefined,
        content: message || (selectedFile ? selectedFile.name : ''),
        type: messageType,
        status: 'sending' as const,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        attachments: attachments.length > 0 ? attachments : undefined,
        isLocked: isLocked && selectedFile ? true : undefined,
        unlockPrice: isLocked && unlockPrice ? Math.round(parseFloat(unlockPrice) * 100) : undefined,
        unlockCurrency: isLocked && unlockPrice ? 'USD' : undefined,
      };

      const docRef = await addDoc(messagesRef, messageData);

      // Update status to sent
      await updateDoc(docRef, {
        status: 'sent',
      });

      // Update chat's last message
      const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
      await updateDoc(chatRef, {
        lastMessageId: docRef.id,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Reset form
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsLocked(false);
      setUnlockPrice('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Send typing indicator
    if (socket && user && e.target.value.trim().length > 0) {
      sendTypingIndicator(socket, chatId, user.displayName || 'User');

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // The server will handle clearing typing state after 3 seconds
      // But we can also send a stop signal if user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        // Typing indicator will auto-clear on server after 3s
      }, 3000);
    }
  };

  return (
    <div className={cn('bg-[#1E1E1E] border-t border-gray-800', className)}>
      {/* File preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-gray-800"
          >
            <div className="relative">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="p-4 bg-gray-800 rounded-lg flex items-center gap-2">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-xs">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Price unlock toggle */}
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-[#FF5E3A] focus:ring-[#FF5E3A]"
                />
                <span className="text-sm text-gray-300">
                  💰 Set Price to Unlock
                </span>
              </label>

              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    value={unlockPrice}
                    onChange={(e) => setUnlockPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF5E3A]"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="flex items-end gap-2 p-4">
        {/* Media upload buttons */}
        <div className="flex items-center gap-1">
          {/* Image/Video/Audio upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex-shrink-0 w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Upload media"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          {/* Camera button (Snap Camera Kit ready) */}
          <button
            onClick={() => {
              // For now, use file input with camera capture
              // TODO: Initialize Snap Camera Kit when @snap/camera-kit is installed
              fileInputRef.current?.click();
            }}
            disabled={disabled || uploading}
            className="flex-shrink-0 w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Take photo/video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          capture="environment" // Use camera on mobile
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || uploading}
          rows={1}
          className={cn(
            'flex-1 max-h-32 resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400',
            'focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || disabled || uploading}
          whileHover={{ scale: uploading ? 1 : 1.05 }}
          whileTap={{ scale: uploading ? 1 : 0.95 }}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all',
            (message.trim() || selectedFile) && !disabled && !uploading
              ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white hover:from-[#FF6E4A] hover:to-[#FFAE67]'
              : 'bg-gray-800 text-gray-400 cursor-not-allowed'
          )}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </motion.button>
      </div>
    </div>
  );
}
