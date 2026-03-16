import React from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "bg-[rgba(20,20,30,0.35)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] rounded-[16px] shadow-[0_0_30px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
