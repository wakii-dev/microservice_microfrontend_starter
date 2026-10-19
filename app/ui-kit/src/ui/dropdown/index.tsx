// Dropdown — trigger + menu overlay (style matrix 2026-10-18: menu rounded-xl,
// shadow var(--shadow-pop); item hover bg-s3, danger = đỏ; divider giữa nhóm key '---').
// Đóng: click item / ESC / click ngoài (document listener).
// A11y (batch ⑫ worker C): role=menu/menuitem, ArrowUp/Down/Home/End đi giữa
// item, mở bằng keyboard (Enter/Space/ArrowDown) → focus item đầu, ESC → đóng
// + trả focus về trigger.
import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface DropdownItem {
  key: string;
  label: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  /** Trigger element (click để mở). */
  trigger: ReactNode;
  /** Item menu — key '---' render divider. */
  items: DropdownItem[];
  /** Callback khi click item (không gọi với item disabled). */
  onItemClick?: (key: string) => void;
  className?: string;
}

export function Dropdown({ trigger, items, onItemClick, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  // Mở bằng keyboard (Enter/Space/ArrowDown) → focus item đầu sau khi mở
  const focusFirstOnOpen = useRef(false);

  const itemButtons = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])') ?? [],
    );

  useEffect(() => {
    if (!open) return;
    if (focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      itemButtons()[0]?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        // trả focus về trigger (phần tử focusable đầu trong root)
        rootRef.current
          ?.querySelector<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
          ?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Trigger mở bằng keyboard: ArrowDown mở + focus item đầu với MỌI trigger;
  // Enter/Space với native button → click sự kiện detail=0 (keyboard) → flag trước.
  const onTriggerKey = (e: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusFirstOnOpen.current = true;
      setOpen(true);
    }
  };
  const onTriggerClick = (e: React.MouseEvent) => {
    // click sinh từ bàn phím (Enter/Space trên native button) có detail = 0
    if (e.detail === 0) focusFirstOnOpen.current = true;
    setOpen((o) => !o);
  };

  // Menu keyboard: ArrowUp/Down vòng tròn, Home/End đầu/cuối (bỏ item disabled)
  const onMenuKey = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const buttons = itemButtons();
    if (buttons.length === 0) return;
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      buttons[(idx + 1) % buttons.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      buttons[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      buttons[buttons.length - 1].focus();
    }
  };

  // Trigger được wire aria (cloneElement — pattern Popconfirm): SR biết menu đang
  // mở + trigger mở loại gì; children không phải element → giữ nguyên.
  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })
    : trigger;

  return (
    <span ref={rootRef} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <span onClick={onTriggerClick} onKeyDown={onTriggerKey} className="inline-flex">
        {triggerEl}
      </span>
      {open && (
        <ul
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKey}
          className="absolute right-0 z-[var(--z-dropdown)] mt-1 min-w-[120px] origin-top-right list-none rounded-xl border border-line bg-s2 [background-image:var(--wash)] p-1 shadow-[var(--ele-3),var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-smooth)]"
        >
          {items.map((item, idx) =>
            item.key === '---' ? (
              <li key={item.key} className="my-1 border-t border-line2" />
            ) : (
              <li key={item.key}>
                <button
                  type="button"
                  role="menuitem"
                  aria-disabled={item.disabled || undefined}
                  disabled={item.disabled}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className={`w-full cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body transition-colors duration-[240ms] ease-[var(--ease-smooth)] animate-[bp-fade-in_var(--motion-fast)_var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    item.danger ? 'text-st-fail hover:bg-st-fail/12 active:bg-st-fail/12' : 'text-ink hover:bg-s3 active:bg-s3'
                  } ${item.disabled ? 'cursor-not-allowed text-ink3' : ''}`}
                  onClick={() => {
                    if (item.disabled) return;
                    onItemClick?.(item.key);
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </span>
  );
}
