// Accordion — nhóm panel MỞ-MỘT (PrimeReact/MUI semantics): mặc định single-open —
// mở item mới TỰ ĐÓNG item đang mở; multiple=true → hành vi Collapse (nhiều mở).
// Khác Collapse (multi-open mặc định, uncontrolled-only): Accordion có controlled
// activeKey (string | string[]) + onChange payload theo mode.
// Visual/motion KẾ THỪA Collapse: rounded-xl border-line bg-s2, header py-3 px-4
// font-medium, chevron xoay 180, animate grid-rows 0fr↔1fr — KẶC cấu trúc 3 tầng
// grid > min-h-0 overflow-hidden > padding-div (padding phải nằm SẠCH tầng clip —
// bug padding-leak Collapse V2, đừng tái phạm).
import { useState } from 'react';
import { Icon } from '../icons/index.js';
import type { CollapseItem } from '../collapse/index.js';

/** Cùng shape Collapse (key/label/children/disabled). */
export type AccordionItem = CollapseItem;

export interface AccordionProps {
  /** Các panel — shape trùng CollapseItem. */
  items: AccordionItem[];
  /** Cho nhiều panel mở cùng lúc (mặc định false = single-open chuẩn Accordion). */
  multiple?: boolean;
  /** Panel mở mặc định (uncontrolled) — string khi single, string[] khi multiple. */
  defaultActiveKey?: string | string[];
  /** Controlled: key (single) hoặc keys (multiple) đang mở. */
  activeKey?: string | string[];
  /** Callback đổi panel — payload string (single) hoặc string[] (multiple). */
  onChange?: (key: string | string[]) => void;
  className?: string;
}

/** Chuẩn hoá prop key (string | string[] | undefined) → Set. */
function toKeySet(value: string | string[] | undefined): Set<string> {
  if (value === undefined) return new Set();
  return new Set(Array.isArray(value) ? value : [value]);
}

export function Accordion({
  items,
  multiple = false,
  defaultActiveKey,
  activeKey,
  onChange,
  className,
}: AccordionProps) {
  const isControlled = activeKey !== undefined;
  const [innerKeys, setInnerKeys] = useState<Set<string>>(() => toKeySet(defaultActiveKey));
  const openKeys = isControlled ? toKeySet(activeKey) : innerKeys;

  function toggle(key: string) {
    // Single-open: mở key → THAY toàn bộ (đóng panel kia); bấm panel đang mở → đóng.
    const next = multiple
      ? (() => {
          const s = new Set(openKeys);
          if (s.has(key)) s.delete(key);
          else s.add(key);
          return s;
        })()
      : openKeys.has(key)
        ? new Set<string>()
        : new Set([key]);
    if (!isControlled) setInnerKeys(next);
    const payload: string | string[] = multiple ? [...next] : (next.values().next().value ?? '');
    onChange?.(payload);
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-s2${className ? ` ${className}` : ''}`}>
      {items.map((item, i) => {
        const open = openKeys.has(item.key);
        return (
          <div key={item.key} className={i > 0 ? 'border-t border-line2' : ''}>
            <button
              id={`accordion-header-${item.key}`}
              type="button"
              aria-expanded={open}
              aria-controls={`accordion-panel-${item.key}`}
              disabled={item.disabled}
              onClick={() => !item.disabled && toggle(item.key)}
              className={`flex w-full items-center justify-between border-none bg-transparent px-4 py-3 text-left text-body font-medium text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                item.disabled ? 'cursor-not-allowed text-ink3' : 'cursor-pointer hover:bg-s3'
              }`}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={`text-ink3 transition-transform ${open ? 'rotate-180' : ''}`}
              >
                <Icon name="chevron-down" size={14} />
              </span>
            </button>
            <div
              id={`accordion-panel-${item.key}`}
              role="region"
              aria-labelledby={`accordion-header-${item.key}`}
              className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              {/* 3 tầng: clip nằm SẠCH padding — px/pb xuống tầng 3, con của element
               * bị overflow-hidden clip (bug padding-leak V2: track 0fr vẫn lộ padding). */}
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
