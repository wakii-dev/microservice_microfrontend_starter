// Toolbar — flex container start/end (antd Toolbar lite).
import type { ReactNode } from 'react';

export interface ToolbarProps {
  children: ReactNode;
  /** Node bên phải. */
  extra?: ReactNode;
  className?: string;
}

export function Toolbar({ children, extra, className }: ToolbarProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2${className ? ` ${className}` : ''}`}>
      <div className="flex items-center gap-2">{children}</div>
      {extra && <div className="flex items-center gap-2">{extra}</div>}
    </div>
  );
}
