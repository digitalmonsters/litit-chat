/**
 * Flame Animations
 * 
 * Reusable animation variants for flame-themed effects
 */

import { Variants } from 'framer-motion';

/**
 * Flame burst animation for join/exit
 */
export const flameBurst: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: [0, 1, 1, 0],
    scale: [0, 1.2, 1, 1.5],
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: [1, 0],
    scale: [1, 1.5],
    filter: 'blur(10px)',
    transition: {
      duration: 0.5,
      ease: 'easeIn',
    },
  },
};

/**
 * Floating hearts animation
 */
export const floatingHeart: Variants = {
  initial: {
    opacity: 0,
    y: 0,
    scale: 0,
  },
  animate: {
    opacity: [0, 1, 1, 0],
    y: -100,
    scale: [0, 1, 1, 0],
    x: [0, 20, -20, 0],
    transition: {
      duration: 3,
      ease: 'easeOut',
    },
  },
};

/**
 * Stars rain animation
 */
export const starsRain: Variants = {
  initial: {
    opacity: 1,
    y: -20,
    rotate: 0,
  },
  animate: {
    opacity: [1, 1, 0],
    y: '100vh',
    rotate: 360,
    x: [0, 10, -10, 0],
    transition: {
      duration: 2,
      ease: 'linear',
    },
  },
};

/**
 * Join animation with flame burst
 */
export const joinAnimation: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -50,
    transition: {
      duration: 0.3,
    },
  },
};


/**
 * Match celebration animation
 */
export const matchCelebration: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  animate: {
    opacity: 1,
    scale: [0, 1.2, 1],
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    rotate: 180,
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * Like button press animation
 */
export const likePress: Variants = {
  initial: { scale: 1 },
  tap: { 
    scale: 0.9,
    transition: { duration: 0.1 }
  },
  success: {
    scale: [0.9, 1.3, 1],
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

/**
 * Swipe card animation
 */
export const swipeCard: Variants = {
  center: {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  swipeLeft: {
    x: -1000,
    rotate: -30,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: 'easeIn',
    },
  },
  swipeRight: {
    x: 1000,
    rotate: 30,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: 'easeIn',
    },
  },
};

/**
 * Flame hearts burst (for match)
 */
export function flameHeartsBurst(count: number = 20) {
  return Array.from({ length: count }, (_, i) => ({
    initial: {
      opacity: 0,
      scale: 0,
      x: 0,
      y: 0,
    },
    animate: {
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0],
      x: Math.cos((i / count) * Math.PI * 2) * (100 + Math.random() * 100),
      y: Math.sin((i / count) * Math.PI * 2) * (100 + Math.random() * 100) - 50,
    },
    transition: {
      duration: 2 + Math.random(),
      ease: 'easeOut',
      delay: i * 0.02,
    },
  }));
}
