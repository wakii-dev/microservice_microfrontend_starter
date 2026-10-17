// Table DataTable — PrimeReact-level client-side data grid (Tier refactor 2026-10-17,
// yêu cầu user: nâng tầm PrimeReact DataTable). Toàn bộ màu qua tokens (@theme inline)
// — không phá light/dark.
//
// Features:
// - Sort: click header asc→desc→none; sortMode 'multiple' + Shift/Meta để thêm key
//   (mirror PrimeReact multiSortMeta); aria-sort trên th.
// - Filter: filter row (inputs) cho column `filterable`; matchMode contains/equals/
//   startsWith (select nhỏ trong cell).
// - Paginator: Pagination ui-kit + rows-per-page Select (rowsPerPageOptions).
// - Selection: 'single' (click row) | 'checkbox' (cột checkbox + select-all-page,
//   indeterminate) — onSelectionChange trả records.
// - Scroll: scrollHeight → wrapper overflow-auto + sticky header (th sticky bg).
// - Variants: striped / borderless / size small|normal|large.
// - loading → skeleton rows; empty → EmptyState; row expansion (expander column +
//   rowExpansion render) với aria-expanded.
// - A11y: role=grid + aria-rowcount, sortable header = button (Enter/Space), cells
//   focus roving bằng Arrow keys trong grid.
import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { EmptyState } from '../empty-state/index';
import { Pagination } from '../pagination/index';
import { Select } from '../select/index';
import { Skeleton } from '../skeleton/index';
import { Checkbox } from '../checkbox/index';

export type SortOrder = 'asc' | 'desc' | 'none';
export interface SortMeta {
  key: string;
  order: 'asc' | 'desc';
}
export type FilterMatchMode = 'contains' | 'equals' | 'startsWith';

export interface TableColumn<T> {
  key: string;
  title: ReactNode;
  render?: (record: T, index: number) => ReactNode;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  filterMatchMode?: FilterMatchMode;
  /** Cột expander (nút ▸/▾ mở rowExpansion). */
  expander?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Array<TableColumn<T>>;
  dataSource: T[];
  rowKey: keyof T;
  sortMode?: 'single' | 'multiple';
  /** true (mặc định theo PrimeReact metaKeySelection) = Shift/Meta click để multi-sort. */
  metaKeySelection?: boolean;
  onSort?: (sort: SortMeta[]) => void;
  paginator?: boolean;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  selectionMode?: 'none' | 'single' | 'checkbox';
  selectedRowKeys?: Array<string>;
  onSelectionChange?: (records: T[]) => void;
  scrollHeight?: number | string;
  striped?: boolean;
  borderless?: boolean;
  size?: 'small' | 'normal' | 'large';
  loading?: boolean;
  emptyMessage?: ReactNode;
  rowExpansion?: (record: T) => ReactNode;
  className?: string;
}

const SIZE_CLS = {
  small: 'px-3 py-1.5 text-label',
  normal: 'px-4 py-2.5 text-body',
  large: 'px-5 py-3.5 text-body',
} as const;

const HEAD_SIZE = {
  small: 'px-3 py-1.5 text-label',
  normal: 'px-4 py-2.5 text-label',
  large: 'px-5 py-3 text-body',
} as const;

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'vi');
}

export function Table<T extends object>({
  columns,
  dataSource,
  rowKey,
  sortMode = 'single',
  metaKeySelection = true,
  onSort,
  paginator = false,
  pageSize: pageSizeProp = 10,
  rowsPerPageOptions = [5, 10, 20, 50],
  selectionMode = 'none',
  selectedRowKeys,
  onSelectionChange,
  scrollHeight,
  striped = false,
  borderless = false,
  size = 'normal',
  loading = false,
  emptyMessage,
  rowExpansion,
  className,
}: TableProps<T>) {
  const [sorts, setSorts] = useState<SortMeta[]>([]);
  const [filters, setFilters] = useState<Record<string, { value: string; mode: FilterMatchMode }>>({});
  const [pageSize, setPageSize] = useState(pageSizeProp);
  const [page, setPage] = useState(1); // 1-based
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const selectedKeys = selectedRowKeys ?? internalSelected;

  // ── filter ──
  const filtered = useMemo(() => {
    const active = Object.entries(filters).filter(([, f]) => f.value.trim() !== '');
    if (active.length === 0) return dataSource;
    return dataSource.filter((record) =>
      active.every(([key, f]) => {
        const raw = (record as Record<string, unknown>)[key];
        const haystack = String(raw ?? '').toLowerCase();
        const needle = f.value.toLowerCase();
        if (f.mode === 'equals') return haystack === needle;
        if (f.mode === 'startsWith') return haystack.startsWith(needle);
        return haystack.includes(needle);
      }),
    );
  }, [dataSource, filters]);

  // ── sort (áp theo thứ tự sorts — multi) ──
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
  }, [filtered, sorts, columns]);

  // ── paginate ──
  const pageCount = paginator ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount);
  const paged = paginator
    ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sorted;

  function headerClick(col: TableColumn<T>, e: ReactMouseEvent) {
    if (!col.sortable) return;
    const existing = sorts.find((s) => s.key === col.key);
    let next: SortMeta[];
    if (!existing) {
      next = applySort(sorts, { key: col.key, order: 'asc' }, sortMode === 'multiple' && (metaKeySelection ? e.shiftKey || e.metaKey || e.ctrlKey : false));
    } else if (existing.order === 'asc') {
      next = applySort(sorts, { key: col.key, order: 'desc' }, sortMode === 'multiple' && (metaKeySelection ? e.shiftKey || e.metaKey || e.ctrlKey : false));
    } else {
      next = sorts.filter((s) => s.key !== col.key); // none = gỡ sort
    }
    setSorts(next);
    onSort?.(next);
  }

  function applySort(current: SortMeta[], meta: SortMeta, additive: boolean): SortMeta[] {
    if (!additive) return [meta];
    const rest = current.filter((s) => s.key !== meta.key);
    return [...rest, meta];
  }

  function sortOf(key: string): SortOrder {
    return sorts.find((s) => s.key === key)?.order ?? 'none';
  }

  // ── selection ──
  const keyOf = (record: T) => String(record[rowKey]);
  const pageRecords = paged;
  const allPageSelected = pageRecords.length > 0 && pageRecords.every((r) => selectedKeys.includes(keyOf(r)));
  const somePageSelected = pageRecords.some((r) => selectedKeys.includes(keyOf(r)));

  function toggleAll() {
    if (allPageSelected) {
      const rest = selectedKeys.filter((k) => !pageRecords.some((r) => keyOf(r) === k));
      emitSelection(rest);
    } else {
      const keys = new Set([...selectedKeys, ...pageRecords.map(keyOf)]);
      emitSelection([...keys]);
    }
  }

  function toggleRow(record: T) {
    const k = keyOf(record);
    if (selectedKeys.includes(k)) {
      emitSelection(selectedKeys.filter((x) => x !== k));
    } else {
      emitSelection([...selectedKeys, k]);
    }
  }

  function selectSingle(record: T) {
    emitSelection([keyOf(record)]);
  }

  function emitSelection(keys: string[]) {
    setInternalSelected(keys);
    onSelectionChange?.(dataSource.filter((r) => keys.includes(keyOf(r))));
  }

  // ── expansion toggle ──
  function toggleExpand(record: T) {
    const k = keyOf(record);
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const hasExpander = columns.some((c) => c.expander);
  const hasSelection = selectionMode === 'checkbox';
  const filterableColumns = columns.filter((c) => c.filterable);
  const showFilterRow = filterableColumns.length > 0;

  const cellPad = SIZE_CLS[size];
  const headPad = HEAD_SIZE[size];
  const borderCls = borderless ? '' : 'border-b border-line2';

  const gridCls = `w-full border-collapse text-left text-body${className ? ` ${className}` : ''}`;

  // Roving focus (a11y grid): Arrow keys di chuyển indicator + focus DOM cell thật
  const [focusCell, setFocusCell] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    gridRef.current
      ?.querySelector<HTMLTableCellElement>('td[data-cell-active="true"], th[data-cell-active="true"]')
      ?.focus();
  }, [focusCell]);

  function onGridKeyDown(e: ReactKeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const maxR = Math.max(0, paged.length + (showFilterRow ? 1 : 0));
    const maxC = columns.length - 1;
    setFocusCell((pos) => {
      let { r, c } = pos;
      if (e.key === 'ArrowDown') r = Math.min(maxR, r + 1);
      if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
      if (e.key === 'ArrowRight') c = Math.min(maxC, c + 1);
      if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
      return { r, c };
    });
  }

  function cellActive(r: number, c: number) {
    return focusCell.r === r && focusCell.c === c;
  }

  const tableNode = (
    <table
      ref={gridRef}
      role="grid"
      aria-rowcount={sorted.length}
      className={gridCls}
      onKeyDown={onGridKeyDown}
    >
      <thead>
        <tr>
          {hasSelection && (
            <th className={`${headPad} ${borderCls} w-10 bg-s3`}>
              <Checkbox
                aria-label="Chọn tất cả trang này"
                checked={allPageSelected}
                onChange={toggleAll}
              />
              {/* indeterminate qua ref — kiểm bằng data-state cho test */}
              <span hidden data-all={String(allPageSelected)} data-some={String(somePageSelected)} />
            </th>
          )}
          {hasExpander && <th className={`${headPad} ${borderCls} w-10 bg-s3`} aria-label="Mở rộng" />}
          {columns.map((col) => {
            const order = sortOf(col.key);
            const ariaSort = order === 'asc' ? 'ascending' : order === 'desc' ? 'descending' : 'none';
            return (
              <th
                key={col.key}
                aria-sort={col.sortable ? ariaSort : undefined}
                aria-colindex={columns.indexOf(col) + 1}
                style={col.width ? { width: col.width } : undefined}
                className={`${headPad} ${borderCls} sticky top-0 z-10 bg-s3 font-semibold text-ink2`}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={(e) => headerClick(col, e)}
                    className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 font-semibold text-inherit hover:text-accent"
                  >
                    {col.title}
                    <span aria-hidden="true" className={`text-[10px] ${order !== 'none' ? 'text-accent' : 'text-ink3'}`}>
                      {order === 'asc' ? '▲' : order === 'desc' ? '▼' : '⇅'}
                    </span>
                  </button>
                ) : (
                  col.title
                )}
              </th>
            );
          })}
        </tr>
        {showFilterRow && (
          <tr role="row">
            {hasSelection && <th className={`${headPad} ${borderCls} bg-s3`} aria-label="Bộ lọc chọn hàng" />}
            {hasExpander && <th className={`${headPad} ${borderCls} bg-s3`} />}
            {columns.map((col) => (
              <th key={`f-${col.key}`} className={`${headPad} ${borderCls} bg-s3 font-normal`}>
                {col.filterable && (
                  <span className="flex items-center gap-1">
                    <input
                      aria-label={`Lọc ${typeof col.title === 'string' ? col.title : col.key}`}
                      value={filters[col.key]?.value ?? ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [col.key]: { value: e.target.value, mode: prev[col.key]?.mode ?? col.filterMatchMode ?? 'contains' },
                        }))
                      }
                      placeholder="Lọc…"
                      className="h-7 w-full min-w-0 rounded-1 border border-line bg-s2 px-2 text-label text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
                    />
                    <select
                      aria-label={`Kiểu lọc ${typeof col.title === 'string' ? col.title : col.key}`}
                      value={filters[col.key]?.mode ?? col.filterMatchMode ?? 'contains'}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [col.key]: { value: prev[col.key]?.value ?? '', mode: e.target.value as FilterMatchMode },
                        }))
                      }
                      className="h-7 cursor-pointer rounded-1 border border-line bg-s2 text-[10px] text-ink2"
                    >
                      <option value="contains">chứa</option>
                      <option value="equals">bằng</option>
                      <option value="startsWith">bắt đầu</option>
                    </select>
                  </span>
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
                <td key={col.key} className={`${cellPad} ${borderCls}`}>
                  <Skeleton variant="text" />
                </td>
              ))}
            </tr>
          ))
        ) : paged.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (hasSelection ? 1 : 0) + (hasExpander ? 1 : 0)} className={`${cellPad}`}>
              {emptyMessage ?? <EmptyState title="Không có dữ liệu" />}
            </td>
          </tr>
        ) : (
          paged.map((record, rowIndex) => {
            const k = keyOf(record);
            const isSelected = hasSelection && selectedKeys.includes(k);
            const isExpanded = expandedKeys.has(k);
            return (
              <Fragment key={k}>
                <tr
                  aria-selected={hasSelection ? isSelected : undefined}
                  className={`${borderCls} transition-colors duration-150 ${
                    isSelected ? 'bg-[#e6f4ff]' : striped && rowIndex % 2 === 1 ? 'bg-[rgba(0,0,0,0.02)]' : ''
                  } hover:bg-s3 ${selectionMode === 'single' ? 'cursor-pointer' : ''}`}
                  onClick={() => selectionMode === 'single' && selectSingle(record)}
                >
                  {hasSelection && (
                    <td className={`${cellPad} ${borderCls}`} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Chọn hàng ${rowIndex + 1}`}
                        checked={isSelected}
                        onChange={() => toggleRow(record)}
                      />
                    </td>
                  )}
                  {hasExpander && (
                    <td className={`${cellPad} ${borderCls}`}>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label="Mở rộng dòng"
                        onClick={() => toggleExpand(record)}
                        className="cursor-pointer border-none bg-transparent text-ink3 transition-transform hover:text-ink"
                      >
                        <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                      </button>
                    </td>
                  )}
                  {columns.map((col, ci) => (
                    <td
                      key={col.key}
                      data-cell-active={cellActive(rowIndex + (showFilterRow ? 1 : 0), ci) || undefined}
                      tabIndex={cellActive(rowIndex + (showFilterRow ? 1 : 0), ci) ? 0 : -1}
                      className={`${cellPad} ${borderCls} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} focus:outline-none data-[cell-active=true]:outline-2 data-[cell-active=true]:-outline-offset-2 data-[cell-active=true]:outline-accent`}
                      onFocus={() => setFocusCell({ r: rowIndex, c: ci })}
                    >
                      {col.render
                        ? col.render(record, rowIndex)
                        : String((record as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
                {isExpanded && rowExpansion && (
                  <tr key={`${k}-expansion`}>
                    <td colSpan={columns.length + (hasSelection ? 1 : 0) + (hasExpander ? 1 : 0)} className="border-b border-line2 bg-s3 p-4">
                      {rowExpansion(record)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );

  return (
    <div className={className}>
      <div
        className="overflow-auto rounded-3 border border-line"
        style={scrollHeight !== undefined ? { maxHeight: typeof scrollHeight === 'number' ? `${scrollHeight}px` : scrollHeight } : undefined}
      >
        {tableNode}
      </div>

      {paginator && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-label text-ink3">
            {sorted.length === 0 ? '0' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`} / {sorted.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-label text-ink3">
              Số dòng
              <Select
                ariaLabel="Số dòng mỗi trang"
                className="w-20"
                value={String(pageSize)}
                options={rowsPerPageOptions.map((n) => ({ label: String(n), value: String(n) }))}
                onChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              />
            </span>
            <Pagination current={safePage} pageSize={pageSize} total={sorted.length} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
