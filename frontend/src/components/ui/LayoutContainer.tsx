import React from 'react';

interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function LayoutContainer({ 
  children, 
  className = '', 
  as: Component = 'div' 
}: LayoutContainerProps) {
  return (
    <Component className={`w-full max-w-7xl mx-auto px-6 lg:px-8 ${className}`}>
      {children}
    </Component>
  );
}
