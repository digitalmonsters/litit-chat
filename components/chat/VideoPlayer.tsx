'use client';

import React from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export default function VideoPlayer({ src, className }: VideoPlayerProps) {
  return (
    <video 
      src={src} 
      controls 
      className={className}
      style={{ maxWidth: '100%', borderRadius: '12px' }}
    />
  );
}
