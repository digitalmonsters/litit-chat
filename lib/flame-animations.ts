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

