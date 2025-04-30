// src/components/ui/Input.js
'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ className, icon, ...props }, ref) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          icon ? 'pl-10' : '',
          className
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export { Input };