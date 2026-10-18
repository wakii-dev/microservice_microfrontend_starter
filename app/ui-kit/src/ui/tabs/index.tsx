// Tabs — type line (antd): tab bar border-b line2, item active chữ accent + gạch
// accent 2px, item padding 12px 0 + gap 32; content render children tab active.
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
  /** Khả định duy nhất của tab (dùng làm activeKey). */
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

  return (
    <div className={`${className ?? ''}${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}`}>
      <div role="tablist" className={`m-0 flex list-none gap-8 border-b border-line2 p-0${classNames?.tablist ? ` ${classNames.tablist}` : ''}`}>
        {items.map((tab) => {
          const isActive = tab.key === current;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange?.(tab.key)}
              className={`relative cursor-pointer border-none bg-transparent px-0 py-3 text-body transition-colors hover:text-accent active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none${classNames?.tab ? ` ${classNames.tab}` : ''} after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:content-[''] after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.16,1,0.3,1)] after:origin-left ${
                isActive
                  ? 'text-accent after:bg-accent after:scale-x-100'
                  : 'text-ink after:bg-transparent after:scale-x-0 hover:text-accent'
              } ${tab.disabled ? 'cursor-not-allowed text-ink3' : ''}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className={`pt-4${classNames?.panel ? ` ${classNames.panel}` : ''}`}>
        {active?.children}
      </div>
    </div>
  );
}
