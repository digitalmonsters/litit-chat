'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { flameTransition } from '@/lib/flame-transitions';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
}

/**
 * Responsive Grid Layout
 * 
 * Provides a responsive grid system for desktop/tablet/mobile with Lit.it branding
 */
function ResponsiveGrid({
  children,
  className,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  gap = 4,
}: ResponsiveGridProps) {
  return (
    <motion.div
      variants={flameTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'grid w-full',
        // Mobile columns
        `grid-cols-${columns.mobile || 1}`,
        // Tablet columns
        `md:grid-cols-${columns.tablet || 2}`,
        // Desktop columns
        `lg:grid-cols-${columns.desktop || 3}`,
        // Gap
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * Responsive Container
 * 
 * Main container with max-width and padding for different breakpoints
 */
export function ResponsiveContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={flameTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'w-full mx-auto',
        // Mobile: full width with padding
        'px-4',
        // Tablet: slightly more padding
        'md:px-6',
        // Desktop: max width and centered
        'lg:max-w-7xl lg:px-8',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * Two Column Layout (Sidebar + Main)
 * 
 * Common layout for chat interfaces
 */
export function TwoColumnLayout({
  sidebar,
  main,
  className,
  sidebarCollapsed = false,
}: {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
}) {
  return (
    <div className={cn('flex h-screen w-full overflow-hidden', className)}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 0 : 'auto',
          opacity: sidebarCollapsed ? 0 : 1,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={cn(
          'flex-shrink-0 overflow-hidden',
          'bg-surface border-r border-border',
          // Mobile: absolute overlay
          'absolute inset-y-0 left-0 z-50',
          // Tablet: show as column
          'md:relative md:z-auto',
          // Desktop: fixed width
          'lg:w-80'
        )}
      >
        {sidebar}
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {main}
      </main>
    </div>
  );
}

/**
 * Three Column Layout (Sidebar + Main + Details)
 * 
 * Advanced layout for desktop with details panel
 */
export function ThreeColumnLayout({
  sidebar,
  main,
  details,
  className,
  detailsOpen = false,
}: {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  details: React.ReactNode;
  className?: string;
  detailsOpen?: boolean;
}) {
  return (
    <div className={cn('flex h-screen w-full overflow-hidden', className)}>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 overflow-y-auto',
          'bg-surface border-r border-border',
          // Mobile: hidden
          'hidden',
          // Tablet: show
          'md:block md:w-80',
          // Desktop: fixed width
          'lg:w-80'
        )}
      >
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {main}
      </main>

      {/* Details panel */}
      <motion.aside
        initial={false}
        animate={{
          width: detailsOpen ? 320 : 0,
          opacity: detailsOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={cn(
          'flex-shrink-0 overflow-hidden',
          'bg-surface border-l border-border',
          // Mobile: hidden
          'hidden',
          // Desktop: show when open
          'lg:block'
        )}
      >
        {detailsOpen && details}
      </motion.aside>
    </div>
  );
}

export default ResponsiveGrid;
