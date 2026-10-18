import type { ReactNode } from 'react';

// Table DataTable types — PrimeReact-level
export type SortOrder = 'asc' | 'desc' | 'none';
export interface SortMeta { key: string; order: 'asc' | 'desc' }

export type StringMatchMode = 'contains' | 'equals' | 'notEquals' | 'startsWith' | 'endsWith';
export type NumberMatchMode = 'lt' | 'lte' | 'gt' | 'gte' | 'equals' | 'notEquals';
export type FilterMatchMode = StringMatchMode | NumberMatchMode;
export type FilterOperator = 'and' | 'or';

export interface FilterConstraint {
  value: string;
  matchMode: FilterMatchMode;
}

export interface ColumnFilter {
  constraints: FilterConstraint[];
  operator: FilterOperator;
}

export const STRING_MODES: Array<{ label: string; value: StringMatchMode }> = [
  { label: 'Chứa', value: 'contains' },
  { label: 'Bằng', value: 'equals' },
  { label: 'Không bằng', value: 'notEquals' },
  { label: 'Bắt đầu', value: 'startsWith' },
  { label: 'Kết thúc', value: 'endsWith' },
];

export const NUMBER_MODES: Array<{ label: string; value: NumberMatchMode }> = [
  { label: '<', value: 'lt' },
  { label: '≤', value: 'lte' },
  { label: '>', value: 'gt' },
  { label: '≥', value: 'gte' },
  { label: '=', value: 'equals' },
  { label: '≠', value: 'notEquals' },
];

export function matchConstraint(value: unknown, constraint: FilterConstraint): boolean {
  const raw = value;
  const filter = constraint.value;
  if (filter === '') return true;
  const isNumeric = ['lt', 'lte', 'gt', 'gte'].includes(constraint.matchMode);
  if (isNumeric) {
    const num = Number(raw); const target = Number(filter);
    if (Number.isNaN(num)) return false;
    switch (constraint.matchMode) {
      case 'lt': return num < target;
      case 'lte': return num <= target;
      case 'gt': return num > target;
      case 'gte': return num >= target;
      case 'equals': return num === target;
      case 'notEquals': return num !== target;
    }
  }
  const str = String(raw ?? '').toLowerCase();
  const f = filter.toLowerCase();
  switch (constraint.matchMode) {
    case 'equals': return str === f;
    case 'notEquals': return str !== f;
    case 'startsWith': return str.startsWith(f);
    case 'endsWith': return str.endsWith(f);
    default: return str.includes(f);
  }
}

export interface TableColumn<T> {
  key: string;
  title: ReactNode;
  render?: (record: T, index: number) => ReactNode;
  width?: string;
  sortable?: boolean;
  /** Bật filter menu (funnel icon) cho column này. */
  filterable?: boolean;
  filterMatchMode?: FilterMatchMode;
  /** Kiểu dữ liệu — quyết định match modes (string modes vs number modes). */
  dataType?: 'string' | 'number';
  /** Cột expander (nút ▸/▾ mở rowExpansion). */
  expander?: boolean;
  /** Frozen: 'left' | 'right' — sticky khi scroll ngang. */
  frozen?: 'left' | 'right';
  /** Cho phép resize (kéo viền cột). */
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
}

/** Cấu hình virtual scroll — chiều cao cố định 1 row (px) dùng cho window math. */
export interface TableVirtualConfig {
  itemHeight: number;
}

export interface TableProps<T> {
  columns: Array<TableColumn<T>>;
  dataSource: T[];
  rowKey: keyof T;
  sortMode?: 'single' | 'multiple';
  metaKeySelection?: boolean;
  onSort?: (sort: SortMeta[]) => void;
  /** Global filter — search qua TẤT CẢ columns. */
  globalFilter?: boolean;
  globalFilterPlaceholder?: string;
  paginator?: boolean;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  selectionMode?: 'none' | 'single' | 'checkbox';
  selectedRowKeys?: Array<string>;
  onSelectionChange?: (records: T[]) => void;
  scrollHeight?: number | string;
  /**
   * Virtual scroll — render windowed rows theo scrollTop khi dữ liệu lớn
   * (> ~50 rows). `true` = itemHeight mặc định 44; object = override.
   * Yêu cầu scrollHeight (viewport) để tính window; giữ selection + sticky header.
   */
  virtual?: boolean | TableVirtualConfig;
  striped?: boolean;
  borderless?: boolean;
  size?: 'small' | 'normal' | 'large';
  loading?: boolean;
  emptyMessage?: ReactNode;
  rowExpansion?: (record: T) => ReactNode;
  /** Filter placement: 'menu' (funnel icon — PrimeReact signature) | 'row' (input row). */
  filterPlacement?: 'menu' | 'row';
  /** Nút export CSV trong toolbar. */
  csvExport?: boolean;
  csvFilename?: string;
  /** Column resize. */
  resizable?: boolean;
  className?: string;
}
