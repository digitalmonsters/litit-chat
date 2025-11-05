'use client';

/**
 * Discover Page
 * 
 * Main app page with discover feed
 */

import React from 'react';
import { motion } from 'framer-motion';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import DiscoverFeed from '@/components/discover/DiscoverFeed';
import { flameFadeIn } from '@/lib/flame-transitions';

export default function DiscoverPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameFadeIn}
      className="h-full bg-[#1E1E1E]"
    >
      <ResponsiveLayout>
        <DiscoverFeed />
      </ResponsiveLayout>
    </motion.div>
  );
}

