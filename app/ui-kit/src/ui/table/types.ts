import type { ReactNode } from 'react';

// Table DataTable types — PrimeReact-level
export type SortOrder = 'asc' | 'desc' | 'none';
/** Trạng thái sort 1 column — key = TableColumn.key. */
export interface SortMeta { key: string; order: 'asc' | 'desc' }

export type StringMatchMode = 'contains' | 'equals' | 'notEquals' | 'startsWith' | 'endsWith';
export type NumberMatchMode = 'lt' | 'lte' | 'gt' | 'gte' | 'equals' | 'notEquals';
export type FilterMatchMode = StringMatchMode | NumberMatchMode;
export type FilterOperator = 'and' | 'or';

/** 1 điều kiện lọc — giá trị nhập + match mode áp lên cột. */
export interface FilterConstraint {
  value: string;
  matchMode: FilterMatchMode;
}

/** Bộ lọc 1 column — nhiều constraint ghép bằng operator (AND/OR). */
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

/** Định nghĩa 1 column — key trùng field của record trong dataSource. */
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

/** Cấu hình scroll kiểu antd — `{ y }` bật fixed header (wrapper max-height + thead sticky). */
export interface TableScrollConfig {
  /** Chiều cao tối đa vùng cuộn (px hoặc CSS length) — thead dính trên, summary dính đáy nếu có. */
  y?: number | string;
}

/** classNames sub-part slots (antd v5 style) — merge SAU default classes. */
export interface TableClassNames {
  /** Scroller bọc bảng (overflow-auto + border). */
  wrapper?: string;
  /** `<thead>` — hàng header. */
  header?: string;
  /** `<tr>` dữ liệu trong tbody. */
  row?: string;
  /** `<td>` dữ liệu. */
  cell?: string;
}

/** Cấu hình expandable rows — API antd Table `expandable` (docs/parity-matrix.md Gap P0).
 *  Cột expander tự inject (chevron-down xoay 90 khi mở) — không cần cột `expander` thủ công. */
export interface TableExpandableConfig<T> {
  /** Nội dung row con khi mở (antd expandedRowRender). */
  expandedRowRender: (record: T, index: number) => ReactNode;
  /** Row mở sẵn lúc mount, uncontrolled (antd defaultExpandedRowKeys). */
  defaultExpandedRowKeys?: Array<string>;
  /** false → row đó không render nút expand (antd rowExpandable). */
  rowExpandable?: (record: T) => boolean;
}

/** Props của Table — data grid client-side (sort/filter/paginate/selection/virtual). */
export interface TableProps<T> {
  columns: Array<TableColumn<T>>;
  dataSource: T[];
  /** Field làm key duy nhất cho row (selection/expansion dựa trên key này). */
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
  /** Scroll kiểu antd — `{ y }` bật fixed header (wrapper max-h + thead sticky; filter row sticky ngay dưới header). */
  scroll?: TableScrollConfig;
  /** Hàng tổng kiểu antd Table `summary` — nhận data TRANG HIỆN TẠI (paged khi paginator, else toàn bộ đã sort);
   *  render `<tfoot>` dính đáy (sticky bottom-0) khi `scroll.y` bật. */
  summary?: (currentData: T[]) => ReactNode;
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
  /** Expandable rows kiểu antd (Gap P0) — cột expander tự inject, ưu tiên hơn `rowExpansion` khi cùng có. */
  expandable?: TableExpandableConfig<T>;
  /** Filter placement: 'menu' (funnel icon — PrimeReact signature) | 'row' (input row). */
  filterPlacement?: 'menu' | 'row';
  /** Nút export CSV trong toolbar. */
  csvExport?: boolean;
  csvFilename?: string;
  /** Column resize. */
  resizable?: boolean;
  /** classNames sub-part slots (antd v5) — merge SAU default. */
  classNames?: TableClassNames;
  className?: string;
}
