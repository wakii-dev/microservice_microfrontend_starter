// Select — PrimeReact Dropdown/MultiSelect level (Tier 4+ nâng cấp):
// filterable · multiple (chips + select-all) · option groups · loading · showClear
// · editable · keyboard đầy đủ · ARIA listbox/combobox chuẩn WAI-ARIA.
// GIỮ NGUYÊN: ariaLabel contract + a11y hơn antd (button+listbox thay span+click).
// Depth contract 2026-10-19: trigger rest bg-s3 + ele-1 → hover nhấc ele-2 + viền
// đậm ink/20; panel nổi = shadow-pop + ele-3 + wash; option hover tint accent/5;
// stagger option mount 30ms (cap 12); empty icon float; mọi transition ease-smooth.
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../icons/index.js';
import { Spinner } from '../spinner/index';

const SMOOTH = 'transition-[background-color,border-color,box-shadow,color] duration-200 ease-[var(--ease-smooth)]';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  /** Option group header — các option con thuộc group này. */
  items?: SelectOption[];
}

export interface SelectProps {
  ariaLabel: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Gõ để lọc option trong panel. */
  filterable?: boolean;
  /** Multi-select mode — chips + select-all/clear-all. */
  multiple?: boolean;
  /** Giới hạn số chips hiển thị (overflow → "+N"). */
  maxSelectedCount?: number;
  /** Loading spinner trong panel. */
  loading?: boolean;
  /** Nút × xoá giá trị. */
  showClear?: boolean;
  /** Cho gõ giá trị tự do (editable). */
  editable?: boolean;
  className?: string;
}

// Flatten option groups → danh sách phẳng cho keyboard/selection
function flattenOptions(options: SelectOption[]): Array<{ label: string; value: string; disabled?: boolean; group?: string }> {
  const result: Array<{ label: string; value: string; disabled?: boolean; group?: string }> = [];
  for (const opt of options) {
    if (opt.items) {
      for (const sub of opt.items) result.push({ ...sub, group: opt.label });
    } else {
      result.push({ label: opt.label, value: opt.value, disabled: opt.disabled });
    }
  }
  return result;
}

export function Select({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder = 'Chọn…',
  disabled = false,
  filterable = false,
  multiple = false,
  maxSelectedCount,
  loading = false,
  showClear = false,
  editable = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState('');
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const flat = useMemo(() => flattenOptions(options), [options]);
  const filteredFlat = useMemo(() => {
    if (!filterable || !search.trim()) return flat;
    const q = search.toLowerCase();
    return flat.filter((o) => o.label.toLowerCase().includes(q));
  }, [flat, filterable, search]);

  const selectedValues = multiple ? (Array.isArray(value) ? value : value ? [value] : []) : value ? [String(value)] : [];
  const selectedLabels = selectedValues.map((v) => flat.find((o) => o.value === v)?.label ?? v);
  const hasValue = selectedValues.length > 0;

  function commit(value: string) {
    if (multiple) {
      const next = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange?.(next);
    } else {
      onChange?.(value);
      setOpen(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) { setOpen(true); setActive(0); }
        else if (!editable && filteredFlat[active] && !filteredFlat[active].disabled) commit(filteredFlat[active].value);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) { setOpen(true); setActive(0); }
        else setActive((i) => Math.min(filteredFlat.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) setActive((i) => Math.max(0, i - 1));
        else { setOpen(true); setActive(filteredFlat.length - 1); }
        break;
      case 'Escape':
        setOpen(false);
        break;
      case 'Home':
        if (open) { e.preventDefault(); setActive(0); }
        break;
      case 'End':
        if (open) { e.preventDefault(); setActive(filteredFlat.length - 1); }
        break;
    }
  }

  function clearValue(e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
    setSearch('');
  }

  // Chips hiển thị (multiple)
  const visibleChips = maxSelectedCount ? selectedLabels.slice(0, maxSelectedCount) : selectedLabels;
  const overflowCount = selectedLabels.length - visibleChips.length;

  return (
    <span className={`relative inline-flex w-full${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (disabled ? undefined : setOpen((o) => !o))}
        onKeyDown={(e) => { if (!editable) onKeyDown(e); }}
        className={`inline-flex h-8 w-full min-w-[120px] cursor-pointer items-center justify-between gap-1 rounded-lg border bg-s3 px-3 text-body shadow-[var(--ele-1)] ${SMOOTH} hover:shadow-[var(--ele-2)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/40 ${
          open ? 'border-accent-hi' : 'border-line hover:border-ink/20'
        } ${disabled ? 'cursor-not-allowed bg-ink/5 text-ink4 shadow-none' : 'text-ink'}`}
      >
        <span className="min-w-0 truncate">
          {multiple && visibleChips.length > 0 ? (
            <span className="flex flex-wrap items-center gap-1">
              {visibleChips.map((label, i) => (
                <span key={i} className="inline-flex items-center gap-0.5 rounded-1 border border-line bg-s3 px-1.5 py-0.5 text-meta text-ink2">
                  {label}
                </span>
              ))}
              {overflowCount > 0 && <span className="text-meta text-ink3">+{overflowCount}</span>}
            </span>
          ) : hasValue && !multiple ? (
            selectedLabels[0] ?? ''
          ) : (
            <span className="text-ink4">{placeholder}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-0.5">
          {showClear && hasValue && !disabled && (
            <span
              role="button"
              aria-label="Xoá"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); clearValue(e as unknown as React.MouseEvent); }}
              onKeyDown={(e) => {
                // span-role-button phải Operable bằng keyboard (Enter/Space) — axe
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  clearValue(e as unknown as React.MouseEvent);
                }
              }}
              className="cursor-pointer text-ink3 hover:text-ink"
            >
              ×
            </span>
          )}
          <span aria-hidden="true" className={`text-ink3 transition-transform duration-200 ease-[var(--ease-smooth)] ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>

      {open && (
        <span className="absolute left-0 top-full mt-1 z-[var(--z-popover)] block w-full min-w-[160px]">
          <span className="block origin-top overflow-hidden rounded-xl border border-line bg-s2 bg-[image:var(--wash)] shadow-[var(--shadow-pop),var(--ele-3)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]">
            {/* Filter input */}
            {filterable && (
              <span className="block border-b border-line2 p-2">
                <input
                  autoFocus
                  aria-label={`${ariaLabel} — tìm kiếm`}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setActive(0); }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(filteredFlat.length - 1, i + 1)); }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
                    if (e.key === 'Enter' && filteredFlat[active]) { e.stopPropagation(); commit(filteredFlat[active].value); setOpen(false); }
                    if (e.key === 'Escape') setOpen(false);
                  }}
                  placeholder="Tìm kiếm…"
                  className="h-7 w-full rounded-1 border border-line bg-s2 px-2 text-label text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
                />
              </span>
            )}

            {/* Select all / clear all (multiple) */}
            {multiple && filteredFlat.length > 0 && (
              <span className="flex items-center justify-between border-b border-line2 px-3 py-1">
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent text-[10px] text-accent hover:underline"
                  onClick={() => onChange?.(filteredFlat.map((o) => o.value))}
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent text-[10px] text-ink3 hover:underline"
                  onClick={() => onChange?.([])}
                >
                  Bỏ tất cả
                </button>
              </span>
            )}

            {/* Loading */}
            {loading ? (
              <span className="block p-3 text-center text-body text-ink3">
                <Spinner label="Đang tải options" variant="dots" />
              </span>
            ) : filteredFlat.length === 0 ? (
              <span className="flex items-center justify-center gap-2 p-3 text-center text-body text-ink3">
                {/* Empty icon float 3s (depth contract — empty-state icon float) */}
                <Icon name="search" size={14} aria-hidden className="animate-[bp-float_3s_var(--ease-smooth)_infinite]" />
                Không có kết quả
              </span>
            ) : (
              <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel}
                className="m-0 max-h-60 min-h-[104px] list-none overflow-auto p-1">
                {filteredFlat.map((option, i) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isActive = i === active;
                  const showGroup = i > 0 && filteredFlat[i - 1].group !== option.group;
                  return (
                    <li key={option.value}>
                      {option.group && showGroup && (
                        <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-ink3">
                          {option.group}
                        </div>
                      )}
                      <div
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled || undefined}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => !option.disabled && commit(option.value)}
                        // Stagger mount 30ms/option (cap 12 mục — list dài không trễ quá ~360ms)
                        style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                        className={`flex h-8 cursor-pointer items-center rounded-lg px-3 text-body animate-[bp-slide-up-in_240ms_var(--ease-smooth)_backwards] ${SMOOTH} ${
                          isSelected ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-accent/5'
                        } ${isActive ? 'outline-1 -outline-offset-1 outline-accent/40' : ''} ${option.disabled ? 'cursor-not-allowed text-ink3' : ''}`}
                      >
                        {multiple && (
                          <span className={`mr-2 size-3.5 shrink-0 rounded-[4px] border ${isSelected ? 'border-accent bg-accent' : 'border-line bg-s2'}`}>
                            {isSelected && <span className="grid size-full place-items-center"><Icon name="check" size={10} className="text-white" /></span>}
                          </span>
                        )}
                        {/* label chiếm phần còn — check icon selected bám mép phải (single; multiple có checkbox riêng) */}
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                        {!multiple && isSelected && (
                          <Icon name="check" size={12} className="shrink-0 text-accent" />
                        )}
                      </div>
                    </li>
                  );
                })}
                {filteredFlat.length === 0 && filterable && (
                  <li className="p-3 text-center text-body text-ink3">Không có kết quả</li>
                )}
              </ul>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
