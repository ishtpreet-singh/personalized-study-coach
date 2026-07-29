import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      className, 
      variant = 'primary', 
      size = 'md', 
      isLoading = false, 
      leftIcon, 
      rightIcon, 
      children, 
      disabled, 
      ...props 
    }, 
    ref
  ) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-glow-primary",
      secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100 focus:ring-primary-500",
      outline: "border-2 border-surface-200 bg-transparent hover:bg-surface-50 text-surface-800 focus:ring-surface-200",
      ghost: "bg-transparent hover:bg-surface-100 text-surface-800 focus:ring-surface-200",
      danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-5 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-11 w-11",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';
