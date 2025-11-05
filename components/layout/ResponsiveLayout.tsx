'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCurrentBreakpoint, isMobile, isTablet, isDesktop } from '@/lib/responsive';
import { cn } from '@/lib/utils';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive Layout Container
 * 
 * Provides responsive breakpoints and layout adjustments
 */
export default function ResponsiveLayout({
  children,
  className,
}: ResponsiveLayoutProps) {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('mobile');
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Set initial width using function form
    const initializeWidth = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        setWindowWidth(width);
        setBreakpoint(getCurrentBreakpoint(width));
      }
    };

    initializeWidth();

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setBreakpoint(getCurrentBreakpoint(width));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'min-h-screen w-full',
        // Mobile: full width, no padding
        isMobile(windowWidth) && 'px-0',
        // Tablet: padding
        isTablet(windowWidth) && 'px-4',
        // Desktop: max width, centered
        isDesktop(windowWidth) && 'max-w-7xl mx-auto px-6',
        className
      )}
      data-breakpoint={breakpoint}
    >
      {children}
    </motion.div>
  );
}

