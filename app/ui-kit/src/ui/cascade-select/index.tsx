// CascadeSelect — chọn có phân cấp (antd Cascader lite).
// Audit fix 2026-10-18: ▸/› ký tự → Icon; z-30 → token --z-popover; panel
// inset-x-0 (fix "panel lệch trái"); aria-expanded/haspopup + role listbox/option;
// focus-visible ring trên trigger.
// Polish 2026-10-18: panel căn GIỮA trigger — width theo content (w-max, left-1/2
// -translate-x-1/2) thay vì inset-x-0 full-width; option bỏ w-full (width theo label,
// min-w giữ cột chạm được).
import { useState } from 'react';
import { Icon } from '../icons/index.js';

export interface CascadeOption {
  label: string; value: string;
  children?: CascadeOption[];
}

export interface CascadeSelectProps {
  options: CascadeOption[];
  value?: string[];
  onChange?: (path: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function CascadeSelect({ options, value = [], onChange, placeholder = 'Chọn…', className }: CascadeSelectProps) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(0);
  // Keyboard nav (a11y listbox): ↑↓ chuyển active, Enter chọn, Esc đóng — focus
  // giữ trên trigger, highlight qua activeIdx (panel ngắn, không cần scrollIntoView).
  const [activeIdx, setActiveIdx] = useState(0);

  let current = options;
  for (let i = 0; i < value.length; i++) {
    const found = current.find((o) => o.value === value[i]);
    if (!found?.children) break;
    current = found.children;
  }

  return (
    <div className={`relative inline-flex w-full${className ? ` ${className}` : ''}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            setOpen(true);
            setActiveIdx((i) => (i + dir + current.length) % current.length);
          } else if (e.key === 'Enter' && open) {
            e.preventDefault();
            const opt = current[activeIdx];
            if (opt) {
              const next = [...value.slice(0, level), opt.value];
              if (opt.children) { setLevel(level + 1); onChange?.(next); }
              else { onChange?.(next); setOpen(false); setLevel(0); }
            }
          } else if (e.key === 'Escape' && open) {
            setOpen(false); setLevel(0);
          }
        }}
        className="inline-flex h-8 w-full items-center justify-between rounded-lg border border-line bg-s3 px-3 text-body text-ink placeholder:text-ink4 shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] hover:border-ink/20 hover:shadow-[var(--ele-2)] focus:border-accent-hi focus:bg-s1 focus:shadow-[var(--ele-2)] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/40 focus-visible:outline-none">
        <span className={value.length > 0 ? '' : 'text-ink4'}>{value.length > 0 ? value.join(' / ') : placeholder}</span>
        <span aria-hidden="true" className="text-ink3"><Icon name="chevron-right" size={12} /></span>
      </button>
      {open && (
        <div role="listbox" aria-label={placeholder}
          className="absolute left-1/2 top-full z-[var(--z-popover)] mt-1 flex w-max max-w-[calc(100vw-16px)] -translate-x-1/2 gap-px overflow-hidden rounded-xl border border-line bg-s2 bg-[image:var(--wash)] shadow-[var(--shadow-pop),var(--ele-3)] animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)]">
          {current.map((option, i) => (
            <button key={option.value} type="button" role="option" aria-selected={value[value.length - 1] === option.value}
              onClick={() => {
                const next = [...value.slice(0, level), option.value];
                if (option.children) { setLevel(level + 1); onChange?.(next); }
                else { onChange?.(next); setOpen(false); setLevel(0); }
              }}
              style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              className={`group/opt block min-w-[140px] cursor-pointer px-3 py-2 text-left text-body text-ink transition-colors duration-200 ease-[var(--ease-smooth)] animate-[bp-slide-up-in_240ms_var(--ease-smooth)_backwards] ${current[activeIdx] === option ? 'bg-s3' : 'hover:bg-accent/5'}`}>
              {option.label}
              {option.children && (
                <span aria-hidden="true" className="float-right text-ink3">
                  <Icon name="chevron-right" size={12} className="transition-transform duration-200 ease-[var(--ease-smooth)] group-hover/opt:translate-x-[2px]" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
