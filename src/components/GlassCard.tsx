import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'solid' | 'hover' | 'mint' | 'amber' | 'crimson' | 'violet';
  className?: string;
}

export default function GlassCard({
  children,
  variant = 'default',
  className = '',
  ...props
}: GlassCardProps) {
  let variantClass = 'glass-card';

  if (variant === 'solid') {
    variantClass = 'glass-card-solid';
  } else if (variant === 'hover') {
    variantClass = 'glass-card hover-elevate cursor-pointer';
  } else if (variant === 'mint') {
    variantClass = 'glass-mint rounded-2xl';
  } else if (variant === 'amber') {
    variantClass = 'glass-amber rounded-2xl';
  } else if (variant === 'crimson') {
    variantClass = 'glass-crimson rounded-2xl';
  } else if (variant === 'violet') {
    variantClass = 'glass-violet rounded-2xl';
  }

  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
