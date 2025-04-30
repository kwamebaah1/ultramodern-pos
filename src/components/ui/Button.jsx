'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const LoadingSpinner = () => (
  <svg 
    className="animate-spin -ml-1 mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const buttonVariants = ({ variant, size, className }) => cn(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
  variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  variant === 'outline' && 'border border-input hover:bg-accent hover:text-accent-foreground',
  variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
  variant === 'link' && 'underline-offset-4 hover:underline text-primary',
  size === 'default' && 'h-10 py-2 px-4',
  size === 'sm' && 'h-9 px-3 rounded-md',
  size === 'lg' && 'h-11 px-8 rounded-md',
  className
);

const Button = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  isLoading = false,
  asChild = false,
  children,
  ...props 
}, ref) => {
  if (asChild) {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      className: cn(
        buttonVariants({ variant, size, className }),
        isLoading && 'opacity-70 pointer-events-none',
        child.props.className
      ),
      disabled: isLoading,
      children: isLoading ? (
        <span className="flex items-center">
          <LoadingSpinner />
          {child.props.children}
        </span>
      ) : (
        child.props.children
      ),
      ...props
    });
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        buttonVariants({ variant, size, className }),
        isLoading && 'opacity-70 pointer-events-none'
      )}
      disabled={isLoading}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <LoadingSpinner />
          {children}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };