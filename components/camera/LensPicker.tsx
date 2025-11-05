'use client';

/**
 * Lens Picker Component
 * 
 * Scrollable filter/lens selection for Snap Camera Kit
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { flameFadeIn } from '@/lib/flame-transitions';

export interface LensPickerProps {
  lensGroups?: Array<{
    id: string;
    name: string;
    thumbnail?: string;
  }>;
  onLensSelect?: (lensId: string) => void;
  className?: string;
}

export default function LensPicker({
  lensGroups = [],
  onLensSelect,
  className,
}: LensPickerProps) {
  const [selectedLens, setSelectedLens] = useState<string | null>(null);

  const handleLensSelect = (lensId: string) => {
    setSelectedLens(lensId);
    onLensSelect?.(lensId);
  };

  // Default lenses if none provided
  const defaultLenses = [
    { id: 'none', name: 'None', thumbnail: null },
    { id: 'flame', name: 'Flame', thumbnail: null },
    { id: 'sparkle', name: 'Sparkle', thumbnail: null },
    { id: 'vintage', name: 'Vintage', thumbnail: null },
    { id: 'colorful', name: 'Colorful', thumbnail: null },
  ];

  const lenses = lensGroups.length > 0 ? lensGroups : defaultLenses;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className={cn('w-full', className)}
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        {lenses.map((lens, index) => (
          <motion.button
            key={lens.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleLensSelect(lens.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
              selectedLens === lens.id
                ? 'border-[#FF5E3A] ring-2 ring-[#FF5E3A]/50'
                : 'border-gray-700 hover:border-gray-600'
            )}
          >
            {lens.thumbnail ? (
              <img
                src={lens.thumbnail}
                alt={lens.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center text-xs font-semibold',
                  selectedLens === lens.id
                    ? 'bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57] text-white'
                    : 'bg-gray-800 text-gray-400'
                )}
              >
                {lens.name.charAt(0)}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
