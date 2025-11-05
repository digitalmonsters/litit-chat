/**
 * Flame-themed transition variants for Framer Motion
 * Following Lit.it brand colors (#FF5E3A to #FF9E57 gradient)
 */

import { Variants } from 'framer-motion';

/**
 * Main flame transition for page/content changes
 * Uses blur and scale effects for smooth transitions
 */
export const flameTransition: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95, 
    filter: 'blur(4px)',
  },
  animate: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Slide-in transition from left (for sidebar, menus)
 */
export const flameSlideIn: Variants = {
  initial: {
    x: '-100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Slide-up transition (for modals, inputs)
 */
export const flameSlideUp: Variants = {
  initial: {
    y: 100,
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: 100,
    opacity: 0,
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Fade in with scale (for cards, messages)
 */
export const flameFadeScale: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Stagger children animation (for lists)
 */
export const flameStagger: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const flameStaggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Glow effect animation for flame-themed elements
 */
export const flameGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(255, 94, 58, 0.3)',
      '0 0 40px rgba(255, 158, 87, 0.5)',
      '0 0 20px rgba(255, 94, 58, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Flicker effect for flame animations
 */
export const flameFlicker: Variants = {
  animate: {
    opacity: [1, 0.9, 1, 0.95, 1],
    filter: [
      'drop-shadow(0 0 10px rgba(255, 94, 58, 0.5))',
      'drop-shadow(0 0 15px rgba(255, 158, 87, 0.6))',
      'drop-shadow(0 0 20px rgba(255, 94, 58, 0.7))',
      'drop-shadow(0 0 15px rgba(255, 158, 87, 0.6))',
      'drop-shadow(0 0 10px rgba(255, 94, 58, 0.5))',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Fade in transition (for pages, modals)
 */
export const flameFadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Page transition configuration
 */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

/**
 * Spring animation for message send
 */
export const messageSendSpring: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      mass: 0.5,
    },
  },
};

/**
 * Spring animation for user join
 */
export const userJoinSpring: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
    y: -20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      mass: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

/**
 * Spring animation for user leave
 */
export const userLeaveSpring: Variants = {
  initial: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

/**
 * Spring animation for modal open/close
 */
export const modalSpring: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 35,
    },
  },
};

/**
 * Backdrop spring animation
 */
export const backdropSpring: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

