import React from 'react';
import { cn } from '../../lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className,
}) => {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center',
        className
      )}
    >
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
};
