'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export interface IntroCarouselProps {
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
}

const slides: CarouselSlide[] = [
  {
    id: '1',
    title: 'Welcome to Lit.it',
    description: 'Real-time chat with flame-powered connections. Connect instantly with your team.',
    icon: '🔥',
    gradient: 'from-[#FF5E3A] to-[#FF9E57]',
  },
  {
    id: '2',
    title: 'Stay Connected',
    description: 'Never miss a message with instant notifications and real-time updates.',
    icon: '⚡',
    gradient: 'from-[#FF9E57] to-[#FF7A4A]',
  },
  {
    id: '3',
    title: 'Secure & Private',
    description: 'Your conversations are encrypted and secure. Privacy is our priority.',
    icon: '🔒',
    gradient: 'from-[#FF7A4A] to-[#FF5E3A]',
  },
];

/**
 * Intro Carousel Component
 * 
 * Displays onboarding slides with flame-themed animations
 */
export default function IntroCarousel({
  onComplete,
  onSkip,
  className,
}: IntroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete?.();
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onComplete?.();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className={cn('flex flex-col h-screen w-full bg-[#1E1E1E]', className)}>
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleSkip}
          className="text-sm text-zinc-400 hover:text-[#FF9E57] transition-colors px-4 py-2"
        >
          Skip
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-8 text-8xl"
            >
              {slide.icon}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent',
                `bg-gradient-to-r ${slide.gradient}`
              )}
            >
              {slide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-zinc-400 max-w-md mb-12"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="pb-8 px-6 space-y-6">
        {/* Dots Indicator */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentSlide
                  ? 'bg-[#FF5E3A] w-8'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              Previous
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] border-0"
          >
            {isLastSlide ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

