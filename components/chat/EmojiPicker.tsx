'use client';

/**
 * Emoji Picker Component
 * 
 * Simple emoji picker for chat messages
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { flameFadeIn, flameSlideUp } from '@/lib/flame-transitions';

export interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EMOJI_CATEGORIES = {
  smileys: {
    name: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉',
      '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
      '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕',
      '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
      '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
    ],
  },
  gestures: {
    name: '👋',
    emojis: [
      '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘',
      '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪',
    ],
  },
  hearts: {
    name: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥', '✨', '💫', '⭐', '🌟',
    ],
  },
  objects: {
    name: '🎉',
    emojis: [
      '🎉', '🎊', '🎁', '🎈', '🎀', '🎂', '🍰', '🧁', '🍕', '🍔', '🍟', '🌭',
      '🍿', '🥤', '☕', '🍺', '🍻', '🥂', '🍷', '🍸', '🍹', '🎵', '🎶', '🎤',
      '🎧', '📱', '💻', '🎮', '🎯', '🏀', '⚽', '🏈', '🎾', '🎱', '⛳',
    ],
  },
};

export default function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={flameSlideUp}
      className={cn(
        'bg-[#1E1E1E] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden',
        className
      )}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Category tabs */}
      <div className="flex border-b border-gray-800 p-2 gap-2">
        {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key as keyof typeof EMOJI_CATEGORIES)}
            className={cn(
              'px-3 py-2 rounded-lg text-2xl transition-colors',
              selectedCategory === key
                ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]'
                : 'hover:bg-gray-800'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-2 p-4 max-h-64 overflow-y-auto">
        {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEmojiSelect(emoji)}
            className="text-2xl p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
