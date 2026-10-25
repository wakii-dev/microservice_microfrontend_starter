// KanbanColumn — 1 cột board: header (tên + count badge spring khi đổi) +
// list card (AnimatePresence enter/exit) + empty hint mỏng "Kéo card vào đây".
// Highlight ring accent khi card đang kéo qua (isDropTarget — set từ board).
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

export interface KanbanColumnProps {
  label: string;
  count: number;
  /** Highlight ring accent — card đang kéo qua cột này. */
  isDropTarget?: boolean;
  /** Ref callback — board đăng ký để pickColumn hit-test. */
  bodyRef?: (element: HTMLDivElement | null) => void;
  children: ReactNode;
}

/** Count badge — pop spring mỗi lần số đổi (key = count → remount animation). */
function CountBadge({ count }: { count: number }) {
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      className="grid min-w-5 place-items-center rounded-pill bg-accent/15 px-1.5 text-meta font-semibold tabular-nums text-accent"
      aria-hidden="true"
    >
      {count}
    </motion.span>
  );
}

export function KanbanColumn({ label, count, isDropTarget = false, bodyRef, children }: KanbanColumnProps) {
  return (
    <section
      aria-label={`Cột ${label}`}
      className={`flex min-h-[320px] flex-col gap-2 rounded-xl border bg-s2/50 p-2.5 transition-shadow ${
        isDropTarget ? 'border-accent ring-2 ring-accent/50' : 'border-line'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="m-0 flex items-center gap-2 text-label font-semibold text-ink">
          <span aria-hidden="true" className={`size-2 rounded-pill ${isDropTarget ? 'bg-accent' : 'bg-line'}`} />
          {label}
        </h3>
        <CountBadge count={count} />
      </div>
      <div ref={bodyRef} className="flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg p-0.5">
        <AnimatePresence initial={false}>
          {count === 0 && (
            <motion.div
              key="empty-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid place-items-center rounded-lg border border-dashed border-line py-6 text-meta text-ink3"
            >
              Kéo card vào đây
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </div>
    </section>
  );
}
