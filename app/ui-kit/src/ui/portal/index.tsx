// Portal — pure createPortal primitive. container: fn → its result; undefined → document.body;
// null (or no document) → render inline (SSR-safe). Modal/Drawer keep their own portals (no retrofit).
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  /** Element or getter; undefined = document.body; null = render inline. */
  container?: HTMLElement | (() => HTMLElement) | null;
  children?: ReactNode;
}

export function Portal(props: PortalProps) {
  const { container, children } = props;
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const resolved =
      typeof container === 'function'
        ? container()
        : container === undefined
          ? typeof document !== 'undefined'
            ? document.body
            : null
          : container; // null stays null → inline
    setTarget(resolved);
  }, [container]);
  if (target === null) return <>{children}</>;
  return createPortal(children, target);
}
