// ScrollPanel — custom scrollbar container (antd lite).
import type { ReactNode } from 'react';

export interface ScrollPanelProps {
  children: ReactNode;
  height?: string;
  className?: string;
}

export function ScrollPanel({ children, height = '200px', className }: ScrollPanelProps) {
  return (
    <div className={`overflow-auto rounded-3 border border-line bg-s2 p-3 [scrollbar-width:thin] [scrollbar-color:var(--line)_transparent]${className ? ` ${className}` : ''}`} style={{ height }}>
      {children}
    </div>
  );
}
