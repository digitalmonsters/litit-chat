'use client';

/**
 * Lens Picker Component
 * 
 * Scrollable filters/lenses for Snap Camera Kit
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { flameFadeIn } from '@/lib/flame-transitions';

export interface LensPickerProps {
  onLensSelect?: (lensId: string) => void;
  selectedLensId?: string;
  className?: string;
}

interface Lens {
  id: string;
  name: string;
  thumbnail?: string;
  icon?: string;
}

export default function LensPicker({
  onLensSelect,
  selectedLensId,
  className,
}: LensPickerProps) {
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLenses() {
      try {
        // Load lenses from Camera Kit
        // This is a placeholder - actual implementation depends on Camera Kit API
        const mockLenses: Lens[] = [
          { id: 'none', name: 'None', icon: '📷' },
          { id: 'flame', name: 'Flame', icon: '🔥' },
          { id: 'sparkle', name: 'Sparkle', icon: '✨' },
          { id: 'vintage', name: 'Vintage', icon: '📸' },
          { id: 'blur', name: 'Blur', icon: '🌫️' },
          { id: 'glow', name: 'Glow', icon: '💫' },
        ];

        setLenses(mockLenses);
        setLoading(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading lenses:', err);
        setLoading(false);
      }
    }

    loadLenses();
  }, []);

  const handleLensSelect = (lensId: string) => {
    onLensSelect?.(lensId);
    // TODO: Apply lens to camera
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <div className="w-6 h-6 border-2 border-[#FF5E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('w-full', className)}
    >
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-2">
        {lenses.map((lens) => (
          <motion.button
            key={lens.id}
            onClick={() => handleLensSelect(lens.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1',
              'border-2 transition-all',
              selectedLensId === lens.id
                ? 'border-[#FF5E3A] bg-gradient-to-br from-[#FF5E3A]/20 to-[#FF9E57]/20'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            )}
          >
            {lens.thumbnail ? (
              <img
                src={lens.thumbnail}
                alt={lens.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <span className="text-2xl">{lens.icon}</span>
            )}
            <span className="text-xs text-gray-300 truncate max-w-full px-1">
              {lens.name}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

