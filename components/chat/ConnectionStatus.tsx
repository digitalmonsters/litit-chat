'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Badge from '../ui/Badge';

export interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
  className?: string;
}

export default function ConnectionStatus({
  isConnected,
  isConnecting = false,
  className,
}: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="info" size="sm">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          Connecting...
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant={isConnected ? 'success' : 'error'}
        size="sm"
      >
        <span
          className={cn(
            'mr-1 inline-block h-2 w-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          )}
        />
        {isConnected ? 'Connected' : 'Disconnected'}
      </Badge>
    </div>
  );
}






