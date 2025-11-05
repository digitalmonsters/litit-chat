'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';

export interface IntroCarouselProps {
  onComplete: () => void;
}

interface CarouselSlide {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    title: 'Welcome to Lit.it',
    description: 'Real-time chat with a flame-themed UI that brings your conversations to life.',
    icon: '🔥',
  },
  {
    id: 2,
    title: 'Stay Connected',
    description: 'Chat with friends, share moments, and keep the conversation burning.',
    icon: '💬',
  },
  {
    id: 3,
    title: 'Get Started',
    description: 'Start chatting now and experience the power of flame-powered communication.',
    icon: '✨',
  },
];

export default function IntroCarousel({ onComplete }: IntroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

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

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentSlide((prev) => {
      const next = prev + newDirection;
      if (next < 0) return 0;
      if (next >= slides.length) return slides.length - 1;
      return next;
    });
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      paginate(1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-[#1E1E1E] via-[#2A1E1E] to-[#1E1E1E] px-4">
      {/* Carousel Container */}
      <div className="relative h-[60vh] w-full max-w-md overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
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
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute flex h-full w-full flex-col items-center justify-center space-y-6"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-8xl md:text-9xl"
            >
              {slides[currentSlide].icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-white"
            >
              {slides[currentSlide].title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-sm text-center text-base md:text-lg text-zinc-400"
            >
              {slides[currentSlide].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicators */}
      <div className="mt-8 flex space-x-2">
        {slides.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1);
              setCurrentSlide(index);
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]'
                : 'w-2 bg-zinc-600'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex w-full max-w-md flex-col gap-4 px-4">
        <Button
          onClick={handleNext}
          variant="primary"
          className="w-full bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white hover:from-[#E54A2A] hover:to-[#FF7A4A]"
        >
          {currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}
        </Button>
        <Button
          onClick={handleSkip}
          variant="ghost"
          className="w-full text-zinc-400"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}

