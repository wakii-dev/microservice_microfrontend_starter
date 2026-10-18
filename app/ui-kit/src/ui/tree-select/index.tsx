// TreeSelect — Select look + data cây đệ quy {value,label,children} (antd
// TreeSelect lite): chỉ chọn leaf · trigger hiện đường dẫn 'Cha / Con' ·
// searchable theo label + đường dẫn · clearable. ARIA combobox/listbox như
// Select; parent render group header (không role=option, không chọn được).
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Icon } from '../icons/index.js';

export interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
}

export interface TreeSelectProps {
  ariaLabel: string;
  treeData: TreeNode[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Ô tìm kiếm trong panel — khớp label hoặc đường dẫn 'Cha / Con'. */
  searchable?: boolean;
  /** Nút × xoá giá trị về ''. */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
}

interface FlatLeaf {
  value: string;
  label: string;
  /** Đường dẫn label từ gốc, gồm cả label của leaf. */
  path: string[];
}

function flattenLeaves(nodes: TreeNode[], ancestors: string[] = []): FlatLeaf[] {
  const out: FlatLeaf[] = [];
  for (const node of nodes) {
    const path = [...ancestors, node.label];
    if (node.children && node.children.length > 0) {
      out.push(...flattenLeaves(node.children, path));
    } else {
      out.push({ value: node.value, label: node.label, path });
    }
  }
  return out;
}

/** Giữ leaf khớp label/path; giữ nhánh cha khi có descendant khớp. */
function filterTree(nodes: TreeNode[], q: string, ancestors: string[] = []): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    const path = [...ancestors, node.label];
    if (node.children && node.children.length > 0) {
      const kids = filterTree(node.children, q, path);
      if (kids.length > 0) out.push({ ...node, children: kids });
    } else {
      const pathStr = path.join(' / ').toLowerCase();
      if (node.label.toLowerCase().includes(q) || pathStr.includes(q)) out.push(node);
    }
  }
  return out;
}

export function TreeSelect({
  ariaLabel,
  treeData,
  value,
  onChange,
  placeholder = 'Chọn…',
  searchable = true,
  clearable = true,
  disabled = false,
  className,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState('');
  // Hybrid: controlled qua `value` (sync khi prop đổi) + uncontrolled nội bộ
  // khi không truyền value (commit/clear tự cập nhật hiển thị).
  const [inner, setInner] = useState<string | undefined>(value);
  useEffect(() => { setInner(value); }, [value]);
  const current = inner;
  const listId = useId();

  const allLeaves = useMemo(() => flattenLeaves(treeData), [treeData]);
  const q = searchable ? search.trim().toLowerCase() : '';
  const visibleTree = useMemo(
    () => (q ? filterTree(treeData, q) : treeData),
    [treeData, q],
  );
  const visibleLeaves = useMemo(() => flattenLeaves(visibleTree), [visibleTree]);

  const selected = current ? allLeaves.find((leaf) => leaf.value === current) : undefined;
  const selectedText = selected ? selected.path.join(' / ') : '';
  const hasValue = Boolean(selected);

  function commit(leaf: FlatLeaf | undefined) {
    if (!leaf) return;
    setInner(leaf.value);
    onChange?.(leaf.value);
    setOpen(false);
    setSearch('');
    setActive(0);
  }

  function clearValue() {
    setInner(undefined);
    onChange?.('');
    setSearch('');
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) { setOpen(true); setActive(0); }
        else commit(visibleLeaves[active]);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) { setOpen(true); setActive(0); }
        else setActive((i) => Math.min(visibleLeaves.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) setActive((i) => Math.max(0, i - 1));
        else { setOpen(true); setActive(visibleLeaves.length - 1); }
        break;
      case 'Escape':
        setOpen(false);
        break;
      case 'Home':
        if (open) { e.preventDefault(); setActive(0); }
        break;
      case 'End':
        if (open) { e.preventDefault(); setActive(visibleLeaves.length - 1); }
        break;
    }
  }

  // Render đệ quy: parent → group header + subtree; leaf → role=option.
  function renderLevel(nodes: TreeNode[], depth: number): React.ReactNode {
    return nodes.map((node) => {
      if (node.children && node.children.length > 0) {
        return (
          <li key={node.value} role="presentation">
            <div className="flex h-8 cursor-default items-center justify-between rounded-lg px-3 text-label font-semibold text-ink2">
              {node.label}
              <span aria-hidden="true" className="text-ink3"><Icon name="chevron-right" size={12} /></span>
            </div>
            <ul role="presentation" className="m-0 list-none p-0">
              {renderLevel(node.children, depth + 1)}
            </ul>
          </li>
        );
      }
      const flatIndex = visibleLeaves.findIndex((leaf) => leaf.value === node.value);
      const isSelected = selected?.value === node.value;
      const isActive = flatIndex === active;
      return (
        <li key={node.value} role="presentation">
          <div
            role="option"
            aria-selected={isSelected}
            aria-level={depth + 1}
            onMouseEnter={() => setActive(flatIndex)}
            onClick={() => commit(visibleLeaves[flatIndex])}
            style={{ paddingLeft: 12 + depth * 16 }}
            className={`flex h-8 cursor-pointer items-center rounded-lg pr-3 text-body ${
              isSelected ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-s3'
            } ${isActive && !isSelected ? 'bg-s3' : ''}`}
          >
            {node.label}
          </div>
        </li>
      );
    });
  }

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
        onKeyDown={onTriggerKeyDown}
        className={`inline-flex h-8 w-full min-w-[120px] cursor-pointer items-center justify-between gap-1 rounded-lg border bg-s2 px-3 text-body transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none ${
          open ? 'border-accent-hi' : 'border-line hover:border-accent'
        } ${disabled ? 'cursor-not-allowed bg-s3 text-ink4' : 'text-ink'}`}
      >
        <span className="min-w-0 truncate">
          {hasValue ? selectedText : <span className="text-ink4">{placeholder}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-0.5">
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              aria-label="Xoá"
              onClick={(e) => { e.stopPropagation(); clearValue(); }}
              className="cursor-pointer rounded-pill border-none bg-transparent p-0 text-ink3 hover:text-ink active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
            >
              <Icon name="times" size={12} />
            </button>
          )}
          <span aria-hidden="true" className={`text-ink3 transition-transform ${open ? 'rotate-180' : ''}`}><Icon name="chevron-down" size={12} /></span>
        </span>
      </button>

      {open && (
        <span className="absolute left-0 top-full mt-1 z-[var(--z-popover)] block w-full min-w-[160px]">
          <span className="block overflow-hidden rounded-xl border border-line bg-s2 shadow-[var(--shadow-pop)]">
            {searchable && (
              <span className="block border-b border-line2 p-2">
                <input
                  autoFocus
                  aria-label={`${ariaLabel} — tìm kiếm`}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setActive(0); }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(visibleLeaves.length - 1, i + 1)); }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
                    if (e.key === 'Enter') { e.stopPropagation(); commit(visibleLeaves[active]); }
                    if (e.key === 'Escape') setOpen(false);
                  }}
                  placeholder="Tìm kiếm…"
                  className="h-7 w-full rounded-1 border border-line bg-s2 px-2 text-label text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
                />
              </span>
            )}

            {visibleLeaves.length === 0 ? (
              <span className="block p-3 text-center text-body text-ink3">Không có kết quả</span>
            ) : (
              <ul id={listId} role="listbox" aria-label={ariaLabel}
                className="m-0 max-h-60 list-none overflow-auto p-1">
                {renderLevel(visibleTree, 0)}
              </ul>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
