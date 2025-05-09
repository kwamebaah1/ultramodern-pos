'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Skeleton = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };