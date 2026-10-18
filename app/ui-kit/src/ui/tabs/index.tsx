// Tabs — type line (antd): tab bar border-b line2, item active chữ accent + gạch
// accent 2px, item padding 12px 0 + gap 32; content render children tab active.
// A11y (WAI-ARIA tabs pattern, a11y sweep 2026-10-18): tab/tabpanel nối id ↔
// aria-controls/aria-labelledby; roving tabindex (tab active=0, còn lại -1);
// ArrowLeft/Right + Home/End đi tab (bỏ disabled), focus kéo theo selection.
import { useId, type KeyboardEvent } from 'react';
import type { ReactNode } from 'react';

/** classNames sub-part slots (antd v5 style) — merge SAU default classes. */
export interface TabsClassNames {
  /** Root div bọc tablist + panel. */
  wrapper?: string;
  /** `<div role="tablist">`. */
  tablist?: string;
  /** Nút tab (`role="tab"`). */
  tab?: string;
  /** `<div role="tabpanel">`. */
  panel?: string;
}

export interface TabItem {
  /** Khóa định duy nhất của tab (dùng làm activeKey). */
  key: string;
  /** Nhãn trên tab bar. */
  label: ReactNode;
  /** Nội dung render trong tabpanel khi tab active. */
  children?: ReactNode;
  /** Tab bị khoá (không click được). */
  disabled?: boolean;
}

export interface TabsProps {
  /** Danh sách tab — thứ tự render trên tab bar. */
  items: TabItem[];
  /** Tab đang active (controlled); mặc định = items[0]. */
  activeKey?: string;
  /** Callback khi chọn tab khác. */
  onChange?: (key: string) => void;
  /** classNames sub-part slots (antd v5) — merge SAU default. */
  classNames?: TabsClassNames;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, classNames, className }: TabsProps) {
  const current = activeKey ?? items[0]?.key;
  const active = items.find((t) => t.key === current);
  const baseId = useId();

  // Roving tabindex + arrow-key: mảng button[] trong tablist, đi tuần bỏ disabled.
  const selectAndFocus = (idx: number) => {
    const tab = items[idx];
    if (!tab || tab.disabled) return;
    onChange?.(tab.key);
    // focus theo selection (controlled thì key đổi qua prop — focus vẫn đẩy thẳng)
    requestAnimationFrame(() => {
      document.getElementById(`${baseId}-tab-${tab.key}`)?.focus();
    });
  };

  const onTablistKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const focusable = items.filter((t) => !t.disabled);
    if (focusable.length === 0) return;
    const activeIdx = items.findIndex((t) => t.key === current);
    const pos = focusable.indexOf(items[activeIdx] ?? items[0]);
    let next = -1;
    if (e.key === 'ArrowRight') next = items.indexOf(focusable[(pos + 1) % focusable.length]);
    else if (e.key === 'ArrowLeft') next = items.indexOf(focusable[(pos - 1 + focusable.length) % focusable.length]);
    else if (e.key === 'Home') next = items.indexOf(focusable[0]);
    else if (e.key === 'End') next = items.indexOf(focusable[focusable.length - 1]);
    else return;
    e.preventDefault();
    selectAndFocus(next);
  };

  return (
    <div className={`${className ?? ''}${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}`}>
      <div
        role="tablist"
        onKeyDown={onTablistKeyDown}
        className={`m-0 flex list-none gap-8 border-b border-line2 p-0${classNames?.tablist ? ` ${classNames.tablist}` : ''}`}
      >
        {items.map((tab) => {
          const isActive = tab.key === current;
          return (
            <button
              key={tab.key}
              id={`${baseId}-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange?.(tab.key)}
              className={`relative cursor-pointer border-none bg-transparent px-0 py-3 text-body transition-colors hover:text-accent active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none${classNames?.tab ? ` ${classNames.tab}` : ''} after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:content-[''] after:transition-transform after:duration-200 after:[transition-timing-function:var(--ease-enter)] after:origin-left ${
                isActive
                  ? 'text-accent after:bg-accent after:scale-x-100'
                  : 'text-ink opacity-65 after:bg-transparent after:scale-x-0 hover:text-accent hover:opacity-100'
              } ${tab.disabled ? 'cursor-not-allowed text-ink3' : ''}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={active ? `${baseId}-tab-${active.key}` : undefined}
        tabIndex={0}
        className={`pt-4${classNames?.panel ? ` ${classNames.panel}` : ''}`}
      >
        {active?.children}
      </div>
    </div>
  );
}
