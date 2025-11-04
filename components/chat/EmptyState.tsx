'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title = 'No items',
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}





