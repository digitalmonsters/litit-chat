'use client';

/**
 * Profile Setup Page
 */

import React from 'react';
import { motion } from 'framer-motion';
import ProfileSetup from '@/components/auth/ProfileSetup';
import { flameFadeIn } from '@/lib/flame-transitions';

export default function ProfileSetupPage() {
  return (
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center p-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={flameFadeIn}
        className="w-full max-w-2xl"
      >
        <ProfileSetup />
      </motion.div>
    </div>
  );
}

