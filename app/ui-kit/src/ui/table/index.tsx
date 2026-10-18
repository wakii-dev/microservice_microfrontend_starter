// Table DataTable — PrimeReact-level client-side data grid.
// Motion identity: CSS thuần — transition-colors + duration từ motion tokens.
//
// Features:
// - Sort: click asc→desc→none; multiple + Shift/Meta; aria-sort
// - Filter Menu (PrimeReact UX signature): funnel icon → dropdown panel
//   (match mode Select + input + multi-constraint AND/OR + Apply/Reset + badge)
// - Global filter: 1 search qua tất cả columns
// - Filter placement: 'menu' (mặc định) | 'row' (input row)
// - Paginator: Pagination + Select số dòng
// - Selection: single (row click) | checkbox (cột + select-all) — GIỮ qua filter/pagination
// - Scroll: scroll.y (antd) | scrollHeight (legacy) + sticky thead + filter row
//   sticky dưới header; summary row (antd) dính đáy khi scroll bật
// - Variants: striped / borderless / size small|normal|large
// - Loading skeleton · EmptyState · Row expansion
// - Virtual scroll (virtual: boolean | { itemHeight } — windowed rows khi > 50
//   rows, spacer rows giữ scrollbar, thead sticky + selection giữ nguyên)
// - CSV export (toolbar button)
// - Column resize (kéo viền cột)
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { EmptyState } from '../empty-state/index';
import { Pagination } from '../pagination/index';
import { Select } from '../select/index';
import { Skeleton } from '../skeleton/index';
import { Button } from '../button/index';
import { Checkbox } from '../checkbox/index';
import { Icon } from '../icons';
import { FilterIcon, FilterFillIcon, FilterSlashIcon } from './icons';
import type {
  SortMeta, SortOrder, FilterMatchMode, FilterOperator,
  FilterConstraint, TableColumn, TableProps, TableVirtualConfig,
} from './types';
export type { SortMeta, SortOrder, FilterMatchMode, FilterOperator, FilterConstraint, TableColumn, TableProps, TableVirtualConfig, TableClassNames, TableExpandableConfig, TableScrollConfig } from './types';
import { STRING_MODES, NUMBER_MODES, matchConstraint } from './types';
// eslint-disable-next-line react-refresh/only-export-components
export { STRING_MODES, NUMBER_MODES, matchConstraint };

// ═══════════════════════════════════════════════════════════════════════════

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'vi');
}

function matchColumn(value: unknown, filter: { constraints: FilterConstraint[]; operator: FilterOperator }): boolean {
  if (filter.constraints.length === 0) return true;
  const results = filter.constraints.map((c) => matchConstraint(value, c));
  return filter.operator === 'and' ? results.every(Boolean) : results.some(Boolean);
}

const SIZE_CLS = { small: 'px-3 py-1.5 text-label', normal: 'px-4 py-2.5 text-body', large: 'px-5 py-3.5 text-body' } as const;
const HEAD_SIZE = { small: 'px-3 py-1.5 text-label', normal: 'px-4 py-2.5 text-label', large: 'px-5 py-3 text-body' } as const;

// ── Virtual scroll — render windowed rows theo scrollTop ──
const VIRTUAL_THRESHOLD = 50;   // chỉ engage khi số rows > ngưỡng
const VIRTUAL_OVERSCAN = 8;     // render dư 8 rows mỗi phía
const VIRTUAL_ROW_HEIGHT = 44;  // itemHeight mặc định khi virtual=true

// ═══════════════════════════════════════════════════════════════════════════
// Filter Menu — funnel icon + dropdown (PrimeReact UX signature)

function FilterMenu({ col, filter, onChange }: {
  col: TableColumn<never>;
  filter: { constraints: FilterConstraint[]; operator: FilterOperator };
  onChange: (f: { constraints: FilterConstraint[]; operator: FilterOperator }) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const modes = col.dataType === 'number' ? NUMBER_MODES : STRING_MODES;

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', fn);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', fn); document.removeEventListener('keydown', key); };
  }, [open]);

  const activeCount = filter.constraints.filter((c) => c.value !== '').length;

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={`Lọc ${typeof col.title === 'string' ? col.title : col.key}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex cursor-pointer items-center border-none bg-transparent p-0 text-ink3 transition-colors hover:text-accent active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${activeCount > 0 ? 'text-accent' : ''}`}
      >
        {activeCount > 0
          ? <FilterFillIcon className="text-accent" />
          : <FilterIcon className="text-ink3" />}
        {activeCount > 0 && (
          <span className="absolute -right-2 -top-1.5 grid size-3.5 place-items-center rounded-pill bg-st-fail text-[8px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <span className="absolute left-0 top-[calc(100%+4px)] z-[var(--z-popover)] block w-64 rounded-xl border border-line bg-s2 p-3 shadow-[var(--shadow-pop)]">
          {filter.constraints.map((c, i) => (
            <span key={i} className="mb-3 block">
              <label className="mb-1 block text-label text-ink3">
                {i === 0 ? 'Match Mode' : `Constraint ${i + 1}`}
                {i > 0 && (
                  <button
                    type="button"
                    aria-label={`Xoá điều kiện ${i + 1}`}
                    className="ml-1 cursor-pointer border-none bg-transparent p-0 text-ink3 hover:text-st-fail active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    onClick={() => onChange({ ...filter, constraints: filter.constraints.filter((_, j) => j !== i) })}
                  >
                    <FilterSlashIcon className="inline size-3" />
                  </button>
                )}
              </label>
              <select
                aria-label={`Match mode ${i + 1}`}
                value={c.matchMode}
                onChange={(e) => {
                  const constraints = [...filter.constraints];
                  constraints[i] = { ...constraints[i], matchMode: e.target.value as FilterMatchMode };
                  onChange({ ...filter, constraints });
                }}
                className="mb-1 h-7 w-full cursor-pointer rounded-1 border border-line bg-s2 px-1 text-label text-ink"
              >
                {modes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <input
                aria-label={`Giá trị lọc ${i + 1}`}
                value={c.value}
                onChange={(e) => {
                  const constraints = [...filter.constraints];
                  constraints[i] = { ...constraints[i], value: e.target.value };
                  onChange({ ...filter, constraints });
                }}
                placeholder="Giá trị…"
                className="h-7 w-full rounded-1 border border-line bg-s2 px-2 text-label text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
              />
            </span>
          ))}
          <span className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1 text-label text-ink3">
              Operator:
              <select
                aria-label="Filter operator"
                value={filter.operator}
                onChange={(e) => onChange({ ...filter, operator: e.target.value as FilterOperator })}
                className="cursor-pointer rounded-1 border border-line bg-s2 text-[10px] text-ink2"
              >
                <option value="and">AND</option>
                <option value="or">OR</option>
              </select>
            </span>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-accent hover:underline active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
              onClick={() => onChange({ ...filter, constraints: [...filter.constraints, { value: '', matchMode: col.filterMatchMode ?? 'contains' }] })}
            >
              + Thêm
            </button>
          </span>
          <span className="flex items-center justify-between border-t border-line2 pt-2">
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-body text-ink3 hover:text-ink active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
              onClick={() => onChange({ constraints: [{ value: '', matchMode: col.filterMatchMode ?? 'contains' }], operator: 'and' })}
            >
              Clear
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-lg border-none bg-accent px-3 py-1 text-label font-semibold text-white hover:bg-accent-hi active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
              onClick={() => setOpen(false)}
            >
              Apply
            </button>
          </span>
        </span>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Table

export function Table<T extends object>({
  columns,
  dataSource,
  rowKey,
  sortMode = 'single',
  metaKeySelection = true,
  onSort,
  globalFilter = false,
  globalFilterPlaceholder = 'Tìm kiếm…',
  paginator = false,
  pageSize: pageSizeProp = 10,
  rowsPerPageOptions = [5, 10, 20, 50],
  selectionMode = 'none',
  selectedRowKeys: controlledSelected,
  onSelectionChange,
  scrollHeight,
  scroll,
  summary,
  virtual = false,
  striped = false,
  borderless = false,
  size = 'normal',
  loading = false,
  emptyMessage,
  rowExpansion,
  expandable,
  filterPlacement = 'menu',
  csvExport = false,
  csvFilename = 'export',
  resizable = false,
  classNames,
  className,
}: TableProps<T>) {
  const [sorts, setSorts] = useState<SortMeta[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, { constraints: FilterConstraint[]; operator: FilterOperator }>>({});
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [pageSize, setPageSize] = useState(pageSizeProp);
  const [page, setPage] = useState(1);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  // expandable.defaultExpandedRowKeys → mở sẵn lúc mount (uncontrolled, chỉ đọc lần đầu)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(expandable?.defaultExpandedRowKeys ?? []),
  );
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const resizeRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  // Fixed header: chiều cao hàng header chính — filter row sticky ngay dưới nó khi scroll.y bật
  const [headerH, setHeaderH] = useState(0);

  const selectedKeys = controlledSelected ?? internalSelected;

  // ── filter pipeline: column filters → global filter ──
  const filtered = useMemo(() => {
    let data = dataSource;
    // column filters
    const activeColFilters = Object.entries(columnFilters).filter(
      ([, f]) => f.constraints.some((c) => c.value !== ''),
    );
    if (activeColFilters.length > 0) {
      data = data.filter((record) =>
        activeColFilters.every(([key, f]) =>
          matchColumn((record as Record<string, unknown>)[key], f),
        ),
      );
    }
    // global filter
    if (globalFilterValue.trim()) {
      const q = globalFilterValue.toLowerCase();
      data = data.filter((record) =>
        columns.some((col) => {
          const raw = (record as Record<string, unknown>)[col.key];
          return String(raw ?? '').toLowerCase().includes(q);
        }),
      );
    }
    return data;
  }, [dataSource, columnFilters, globalFilterValue, columns]);

  // ── sort ──
  const sorted = useMemo(() => {
    if (sorts.length === 0) return filtered;
    const data = [...filtered];
    data.sort((a, b) => {
      for (const { key, order } of sorts) {
        const cmp = compare((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]) * (order === 'asc' ? 1 : -1);
        if (cmp !== 0) return cmp;
      }
      return 0;
    });
    return data;
  }, [filtered, sorts]);

  // ── paginate ──
  const pageCount = paginator ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount);
  const paged = paginator ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize) : sorted;

  // ── scroll: scroll.y (antd) ưu tiên hơn scrollHeight (legacy) — cùng ý nghĩa wrapper max-h ──
  const scrollY = scroll?.y ?? scrollHeight;

  // ── virtual window: render duy nhất các rows trong viewport (+overscan 2 phía) ──
  // Kỹ thuật: 2 spacer rows (trước/sau window) giữ tổng chiều cao body =
  // itemHeight × rows → scrollbar đúng; thead sticky + column width giữ nguyên
  // vì vẫn là 1 bảng duy nhất. virtual off (hoặc ≤ ngưỡng) → render như cũ.
  const virtualCfg: TableVirtualConfig | null =
    virtual == null || virtual === false
      ? null
      : { itemHeight: typeof virtual === 'object' ? virtual.itemHeight : VIRTUAL_ROW_HEIGHT };
  const virtualOn = virtualCfg != null && !loading && paged.length > VIRTUAL_THRESHOLD;
  const rowHeight = virtualCfg?.itemHeight ?? VIRTUAL_ROW_HEIGHT;
  const viewportH = scrollerRef.current?.clientHeight
    || (typeof scrollY === 'number' ? scrollY : 400);
  const maxScroll = Math.max(0, paged.length * rowHeight - viewportH);
  const clampedTop = Math.min(scrollTop, maxScroll);
  const winStart = virtualOn ? Math.max(0, Math.floor(clampedTop / rowHeight) - VIRTUAL_OVERSCAN) : 0;
  const winEnd = virtualOn
    ? Math.min(paged.length, Math.ceil((clampedTop + viewportH) / rowHeight) + VIRTUAL_OVERSCAN)
    : paged.length;
  const windowed = virtualOn ? paged.slice(winStart, winEnd) : paged;

  // ── selection: GIỮ qua filter/pagination (keys-based) ──
  const keyOf = (r: T) => String(r[rowKey]);
  const pageRecords = paged;
  const allPageSelected = pageRecords.length > 0 && pageRecords.every((r) => selectedKeys.includes(keyOf(r)));

  function emitSelection(keys: string[]) {
    setInternalSelected(keys);
    onSelectionChange?.(dataSource.filter((r) => keys.includes(String(r[rowKey]))));
  }

  function toggleAll() {
    if (allPageSelected) {
      emitSelection(selectedKeys.filter((k) => !pageRecords.some((r) => keyOf(r) === k)));
    } else {
      emitSelection([...new Set([...selectedKeys, ...pageRecords.map(keyOf)])]);
    }
  }

  function toggleRow(record: T) {
    const k = keyOf(record);
    emitSelection(
      selectedKeys.includes(k) ? selectedKeys.filter((x) => x !== k) : [...selectedKeys, k],
    );
  }

  // ── sort click ──
  function headerClick(col: TableColumn<T>, e: ReactMouseEvent) {
    if (!col.sortable) return;
    const existing = sorts.find((s) => s.key === col.key);
    const additive = sortMode === 'multiple' && (metaKeySelection ? e.shiftKey || e.metaKey || e.ctrlKey : false);
    let next: SortMeta[];
    if (!existing) {
      next = applySort(sorts, { key: col.key, order: 'asc' }, additive);
    } else if (existing.order === 'asc') {
      next = applySort(sorts, { key: col.key, order: 'desc' }, additive);
    } else {
      next = sorts.filter((s) => s.key !== col.key);
    }
    setSorts(next);
    onSort?.(next);
  }

  function applySort(current: SortMeta[], meta: SortMeta, additive: boolean): SortMeta[] {
    if (!additive) return [meta];
    return [...current.filter((s) => s.key !== meta.key), meta];
  }

  function sortOf(key: string): SortOrder {
    return sorts.find((s) => s.key === key)?.order ?? 'none';
  }

  // ── CSV export ──
  function exportCsv() {
    const headers = columns.map((c) => (typeof c.title === 'string' ? c.title : c.key)).join(',');
    const rows = sorted.map((r) =>
      columns.map((c) => {
        const v = (r as Record<string, unknown>)[c.key];
        return `"${String(v ?? '').replace(/"/g, '""')}"`;
      }).join(','),
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${csvFilename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── column resize ──
  function startResize(e: ReactMouseEvent, colKey: string) {
    e.preventDefault(); e.stopPropagation();
    const th = (e.target as HTMLElement).closest('th');
    const startW = th?.offsetWidth ?? 100;
    resizeRef.current = { key: colKey, startX: e.clientX, startW };
    const onMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      const w = Math.max(60, resizeRef.current.startW + me.clientX - resizeRef.current.startX);
      setColWidths((prev) => ({ ...prev, [resizeRef.current!.key]: w }));
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const hasExpander = columns.some((c) => c.expander) || expandable !== undefined;
  const hasSelection = selectionMode === 'checkbox';
  const extraCols = (hasSelection ? 1 : 0) + (hasExpander ? 1 : 0);
  const cellPad = SIZE_CLS[size];
  const headPad = HEAD_SIZE[size];
  const borderCls = borderless ? '' : 'border-b border-line2';
  const showFilterRow = filterPlacement === 'row' && columns.some((c) => c.filterable);

  // Fixed header (scroll.y): đo chiều cao hàng header → filter row sticky ngay dưới nó
  useEffect(() => {
    if (scrollY === undefined) return;
    const measure = () => setHeaderH(theadRef.current?.rows[0]?.offsetHeight ?? 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [scrollY, size, showFilterRow]);

  return (
    <div className={className}>
      {/* Toolbar: global search + CSV export */}
      {(globalFilter || csvExport) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {globalFilter && (
            <input
              aria-label="Tìm kiếm toàn cục"
              value={globalFilterValue}
              onChange={(e) => { setGlobalFilterValue(e.target.value); setPage(1); }}
              placeholder={globalFilterPlaceholder}
              className="h-8 w-64 rounded-lg border border-line bg-s2 px-3 text-body text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
            />
          )}
          {csvExport && (
            <Button size="small" onClick={exportCsv}>
              ⬇ CSV
            </Button>
          )}
        </div>
      )}

      <div
        ref={scrollerRef}
        className={`overflow-auto rounded-xl border border-line${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}`}
        style={scrollY !== undefined ? { maxHeight: typeof scrollY === 'number' ? `${scrollY}px` : scrollY } : undefined}
        onScroll={virtualOn ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
      >
        <table
          role="grid"
          aria-rowcount={sorted.length}
          className="w-full border-collapse text-left text-body"
          style={virtualOn ? { tableLayout: 'fixed' } : undefined}
        >
          <thead ref={theadRef} className={classNames?.header}>
            <tr>
              {hasSelection && (
                <th className={`${headPad} ${borderCls} w-10 bg-s3`}>
                  <Checkbox
                    aria-label="Chọn tất cả trang này"
                    checked={allPageSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {hasExpander && <th className={`${headPad} ${borderCls} w-10 bg-s3`} aria-label="Mở rộng" />}
              {columns.map((col) => {
                const order = sortOf(col.key);
                const ariaSort = order === 'asc' ? 'ascending' : order === 'desc' ? 'descending' : undefined;
                const isActiveSort = order !== 'none';
                const colFilter = columnFilters[col.key];
                const w = colWidths[col.key];
                return (
                  <th
                    key={col.key}
                    aria-sort={col.sortable ? ariaSort : undefined}
                    aria-colindex={columns.indexOf(col) + 1}
                    style={{
                      ...(col.width && !w ? { width: col.width } : {}),
                      ...(w ? { width: `${w}px`, minWidth: `${w}px` } : {}),
                    }}
                    className={`${headPad} ${borderCls} sticky top-0 z-10 bg-s3 font-semibold text-ink2`}
                  >
                    <span className="flex items-center gap-1">
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={(e) => headerClick(col, e)}
                          className={`inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 font-semibold text-inherit transition-colors hover:text-accent active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${isActiveSort ? 'text-accent' : ''}`}
                        >
                          {col.title}
                          <span aria-hidden="true" className={`text-[10px] ${isActiveSort ? 'text-accent' : 'text-ink3 opacity-40'}`}>
                            {order === 'asc' ? '▲' : order === 'desc' ? '▼' : '⇅'}
                          </span>
                        </button>
                      ) : (
                        col.title
                      )}
                      {/* Filter Menu funnel */}
                      {col.filterable && filterPlacement === 'menu' && (
                        <FilterMenu
                          col={col as TableColumn<never>}
                          filter={colFilter ?? { constraints: [{ value: '', matchMode: col.filterMatchMode ?? 'contains' }], operator: 'and' }}
                          onChange={(f) => { setColumnFilters((p) => ({ ...p, [col.key]: f })); setPage(1); }}
                        />
                      )}
                      {resizable && (
                        <span
                          role="presentation"
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-accent/30"
                          onMouseDown={(e) => startResize(e, col.key)}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
            {showFilterRow && (
              <tr role="row">
                {hasSelection && <th className={`${headPad} ${borderCls} bg-s3`} />}
                {hasExpander && <th className={`${headPad} ${borderCls} bg-s3`} />}
                {columns.map((col) => (
                  <th
                    key={`f-${col.key}`}
                    style={scrollY !== undefined ? { top: headerH } : undefined}
                    className={`${headPad} ${borderCls} bg-s3 font-normal${scrollY !== undefined ? ' sticky z-10' : ''}`}
                  >
                    {col.filterable && (
                      <input
                        aria-label={`Lọc ${typeof col.title === 'string' ? col.title : col.key}`}
                        value={columnFilters[col.key]?.constraints[0]?.value ?? ''}
                        onChange={(e) =>
                          setColumnFilters((p) => ({
                            ...p,
                            [col.key]: {
                              constraints: [{ value: e.target.value, matchMode: col.filterMatchMode ?? 'contains' }],
                              operator: 'and',
                            },
                          }))
                        }
                        placeholder="Lọc…"
                        className="h-7 w-full min-w-0 rounded-1 border border-line bg-s2 px-2 text-label text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {hasSelection && <td className={`${cellPad} ${borderCls}`}><Skeleton variant="text" /></td>}
                  {hasExpander && <td className={`${cellPad} ${borderCls}`} />}
                  {columns.map((col) => (
                    <td key={col.key} className={`${cellPad} ${borderCls}`}><Skeleton variant="text" /></td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + extraCols} className={`${cellPad}`}>
                  {emptyMessage ?? <EmptyState title="Không có dữ liệu" />}
                </td>
              </tr>
            ) : (
              <>
                {virtualOn && winStart > 0 && (
                  <tr aria-hidden="true" style={{ height: winStart * rowHeight }}>
                    <td colSpan={columns.length + extraCols} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}
                {windowed.map((record, i) => {
                const rowIndex = winStart + i;
                const k = keyOf(record);
                const isSelected = hasSelection && selectedKeys.includes(k);
                const isExpanded = expandedKeys.has(k);
                const canExpand = expandable ? (expandable.rowExpandable ? expandable.rowExpandable(record) : true) : true;
                return (
                  <Fragment key={k}>
                    <tr
                      style={virtualOn ? { height: rowHeight } : undefined}
                      aria-selected={hasSelection ? isSelected : undefined}
                      className={`${borderCls} transition-colors duration-150 ${
                        isSelected ? 'bg-accent/10' : striped && rowIndex % 2 === 1 ? 'bg-s3/40' : ''
                      } hover:bg-s3 ${selectionMode === 'single' ? 'cursor-pointer' : ''}${classNames?.row ? ` ${classNames.row}` : ''}`}
                      onClick={() => selectionMode === 'single' && emitSelection([keyOf(record)])}
                    >
                      {hasSelection && (
                        <td className={`${cellPad} ${borderCls}${classNames?.cell ? ` ${classNames.cell}` : ''}`} onClick={(e) => e.stopPropagation()}>
                          <Checkbox aria-label={`Chọn hàng ${rowIndex + 1}`} checked={isSelected} onChange={() => toggleRow(record)} />
                        </td>
                      )}
                      {hasExpander && (
                        <td className={`${cellPad} ${borderCls}${classNames?.cell ? ` ${classNames.cell}` : ''}`}>
                          {canExpand && (
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label="Mở rộng dòng"
                              onClick={() => setExpandedKeys((p) => {
                                const n = new Set(p);
                                if (n.has(k)) n.delete(k); else n.add(k);
                                return n;
                              })}
                              className="cursor-pointer border-none bg-transparent text-ink3 transition-transform hover:text-ink active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                            >
                              {/* expandable (antd) → chevron-down; legacy rowExpansion giữ chevron-right. Cả hai xoay 90 khi mở */}
                              <span className={`inline-grid place-items-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                <Icon name={expandable ? 'chevron-down' : 'chevron-right'} size={12} />
                              </span>
                            </button>
                          )}
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`${cellPad} ${borderCls} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}${classNames?.cell ? ` ${classNames.cell}` : ''}`}
                        >
                          {col.render ? col.render(record, rowIndex) : String((record as Record<string, unknown>)[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && (expandable || rowExpansion) && (
                      <tr key={`${k}-ex`}>
                        <td colSpan={columns.length + extraCols} className="border-b border-line2 bg-s3 p-4">
                          {expandable ? expandable.expandedRowRender(record, rowIndex) : rowExpansion!(record)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
                })}
                {virtualOn && winEnd < paged.length && (
                  <tr aria-hidden="true" style={{ height: (paged.length - winEnd) * rowHeight }}>
                    <td colSpan={columns.length + extraCols} style={{ padding: 0, border: 'none' }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
          {/* Summary row (antd Table summary) — nhận data trang hiện tại; dính đáy khi scroll.y bật */}
          {summary && !loading && (
            <tfoot>
              <tr>
                <td
                  colSpan={columns.length + extraCols}
                  className={`${cellPad} border-t border-line2 bg-s3 font-medium sticky bottom-0`}
                >
                  {summary(paged)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {paginator && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-label text-ink3">
            {sorted.length === 0
              ? '0'
              : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`} / {sorted.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-label text-ink3">
              Số dòng
              <Select
                ariaLabel="Số dòng mỗi trang"
                className="w-20"
                value={String(pageSize)}
                options={rowsPerPageOptions.map((n) => ({ label: String(n), value: String(n) }))}
                onChange={(v) => { setPageSize(Number(v)); setPage(1); }}
              />
            </span>
            <Pagination current={safePage} pageSize={pageSize} total={sorted.length} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
