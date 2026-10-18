import { useState, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';
// Collapse — các panel gập/mở (antd lite): items key/label/children; nhiều panel
// mở cùng lúc (Set keys); chevron xoay; border-b phân cách.

export interface CollapseItem {
  /** Key duy nhất — nhận diện panel trong openKeys. */
  key: string;
  /** Tiêu đề header (cũng là nút toggle). */
  label: ReactNode;
  /** Nội dung gập/mở (animate grid-rows). */
  children: ReactNode;
  /** Panel khoá — header không bấm được (antd disabled). */
  disabled?: boolean;
}

export interface CollapseProps {
  /** Các panel — nhiều panel có thể mở cùng lúc (Set keys). */
  items: CollapseItem[];
  /** Keys mở mặc định (uncontrolled). */
  defaultActiveKeys?: string[];
  /** Chỉ 1 panel mở tại 1 thời điểm (antd accordion). */
  accordion?: boolean;
  className?: string;
}

export function Collapse({ items, defaultActiveKeys = [], accordion = false, className }: CollapseProps) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(defaultActiveKeys));

  function toggle(key: string) {
    setOpenKeys((prev) => {
      if (accordion) return prev.has(key) ? new Set<string>() : new Set([key]);
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-s2${className ? ` ${className}` : ''}`}>
      {items.map((item, i) => {
        const open = openKeys.has(item.key);
        return (
          <div key={item.key} className={i > 0 ? 'border-t border-line2' : ''}>
            <button
              type="button"
              aria-expanded={open}
              disabled={item.disabled}
              onClick={() => !item.disabled && toggle(item.key)}
              className={`flex w-full items-center justify-between border-none bg-transparent px-4 py-3 text-left text-body font-medium text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                item.disabled ? 'cursor-not-allowed text-ink3' : 'cursor-pointer hover:bg-s3'
              }`}
            >
              {item.label}
              <span aria-hidden="true" className={`text-ink3 transition-transform ${open ? 'rotate-180' : ''}`}>
                <Icon name="chevron-down" size={14} />
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              {/* 3 tầng: clip nằm SẠCH padding — overflow không clip padding của chính nó,
               * để px-4/pb-3 trên element overflow-hidden ⇒ track 0fr vẫn cao 12px (lộ nửa
               * dòng khi đóng). Padding + typography xuống tầng 3, con của element được clip. */}
              <div className="min-h-0 overflow-hidden">
                <div className="px-4 pb-3 text-body text-ink2">{item.children}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
