// TreeTable — cây đệ quy dạng bảng kiểu PrimeReact TreeTable: data lồng children,
// expander chevron xoay 90, indent theo depth (bước bước --sp-4), selection
// single/checkbox theo ngôn ngữ Table (bg-accent/10 + hover:bg-s3 + header select-all).
// Animation mở rộng: đúng KẶC 3 tầng grid > min-h-0 overflow-hidden > content
// (pattern fix padding-leak V2 của Collapse — track 0fr phải clip SẠCH padding).
// A11y: role=treegrid + rowgroup/row/cell, aria-level + aria-expanded trên row,
// expander là <button aria-expanded aria-label>; row selected → aria-selected.
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Checkbox } from '../checkbox/index';
import { EmptyState } from '../empty-state/index';
import { Icon } from '../icons/index.js';

export interface TreeTableNode {
  /** Khóa định danh của node (selection/expandedKeys dùng). */
  key: string;
  /** Node con — lồng không giới hạn cấp. */
  children?: TreeTableNode[];
  /** Giá trị các cột: key = column.key. */
  values: Record<string, ReactNode>;
}

export interface TreeTableColumn {
  /** Khóa cột — khớp key trong node.values. */
  key: string;
  /** Tiêu đề cột (header row). */
  header: ReactNode;
  /** Căn nội dung ô (mặc định left). */
  align?: 'left' | 'center' | 'right';
  /** Render custom — nhận node (và depth nếu cần). */
  render?: (node: TreeTableNode, depth: number) => ReactNode;
}

export interface TreeTableProps {
  /** Cây dữ liệu — node không có children render như lá (không expander). */
  data: TreeTableNode[];
  columns: TreeTableColumn[];
  /** Chọn hàng: none | single (click) | checkbox (cột + select-all). */
  selectionMode?: 'none' | 'single' | 'checkbox';
  /** Keys đang chọn (controlled) — đi kèm onSelectionChange. */
  selectedKeys?: string[];
  /** Callback chọn đổi — mảng keys đầy đủ. */
  onSelectionChange?: (keys: string[]) => void;
  /** Nhánh đang mở (controlled). */
  expandedKeys?: string[];
  /** Nhánh mở mặc định (uncontrolled — đọc lúc mount). */
  defaultExpandedKeys?: string[];
  /** Callback mở/đóng nhánh — mảng keys đang mở sau toggle. */
  onRowToggle?: (keys: string[]) => void;
  /** Nội dung khi data rỗng (mặc định EmptyState). */
  emptyMessage?: ReactNode;
  className?: string;
}

/** Thu toàn bộ keys của cây (select-all dùng). */
function collectKeys(nodes: TreeTableNode[]): string[] {
  const out: string[] = [];
  const walk = (list: TreeTableNode[]) => {
    for (const n of list) {
      out.push(n.key);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

const CELL = 'px-4 py-2.5 text-body'; // chuẩn cell Table size normal

export function TreeTable({
  data,
  columns,
  selectionMode = 'none',
  selectedKeys: controlledSelected,
  onSelectionChange,
  expandedKeys: controlledExpanded,
  defaultExpandedKeys = [],
  onRowToggle,
  emptyMessage,
  className,
}: TreeTableProps) {
  const [innerExpanded, setInnerExpanded] = useState<Set<string>>(() => new Set(defaultExpandedKeys));
  const [innerSelected, setInnerSelected] = useState<string[]>([]);
  const openSet = controlledExpanded ? new Set(controlledExpanded) : innerExpanded;
  const selected = controlledSelected ?? innerSelected;

  const gridCols = `40px ${columns.map(() => 'minmax(0, 1fr)').join(' ')}`;

  function toggleExpand(key: string) {
    const next = new Set(openSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    if (!controlledExpanded) setInnerExpanded(next);
    onRowToggle?.([...next]);
  }

  function emitSelection(keys: string[]) {
    if (!controlledSelected) setInnerSelected(keys);
    onSelectionChange?.(keys);
  }

  function toggleRow(key: string) {
    emitSelection(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  const allSelected = data.length > 0 && collectKeys(data).every((k) => selected.includes(k));

  /** Render 1 node + subtree: row, rồi 3 tầng grid clip phần children. */
  const renderNode = (node: TreeTableNode, depth: number): ReactNode => {
    const isBranch = (node.children?.length ?? 0) > 0;
    const open = openSet.has(node.key);
    const isSelected = selected.includes(node.key);
    const rowStyle: CSSProperties = { gridTemplateColumns: gridCols };
    return (
      <div key={node.key} role="rowgroup">
        <div
          role="row"
          aria-level={depth + 1}
          aria-selected={selectionMode !== 'none' ? isSelected : undefined}
          aria-expanded={isBranch ? open : undefined}
          data-key={node.key}
          style={rowStyle}
          className={`grid border-b border-line2 transition-colors duration-150 ${
            isSelected ? 'bg-accent/10' : ''
          } hover:bg-s3 ${selectionMode === 'single' ? 'cursor-pointer' : ''}`}
          onClick={() => selectionMode === 'single' && toggleRow(node.key)}
        >
          {selectionMode === 'checkbox' && (
            <div role="gridcell" className={`${CELL} w-10`} onClick={(e) => e.stopPropagation()}>
              <Checkbox
                aria-label={`Chọn ${node.key}`}
                checked={isSelected}
                onChange={() => toggleRow(node.key)}
              />
            </div>
          )}
          <div role="gridcell" className={`${CELL} flex items-center`} style={{ paddingLeft: `calc(var(--sp-4) * ${depth})` }}>
            {isBranch ? (
              <button
                type="button"
                aria-expanded={open}
                aria-label={`${open ? 'Đóng' : 'Mở'} ${node.key}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.key);
                }}
                className="cursor-pointer border-none bg-transparent p-0 text-ink3 transition-colors hover:text-ink active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
              >
                {/* Expander xoay 90 như expander Table */}
                <span className={`inline-grid place-items-center transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
                  <Icon name="chevron-right" size={12} />
                </span>
              </button>
            ) : (
              <span className="inline-block w-3" aria-hidden="true" />
            )}
          </div>
          {columns.map((col) => (
            <div
              key={col.key}
              role="gridcell"
              className={`${CELL} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
            >
              {col.render ? col.render(node, depth) : node.values[col.key] ?? ''}
            </div>
          ))}
        </div>
        {isBranch && (
          <div
            className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            {/* 3 tầng: clip nằm SẠCH padding — subtree nằm trong min-h-0 overflow-hidden
             * (pattern V2: để padding trên element clip ⇒ track 0fr vẫn lộ chiều cao). */}
            <div className="min-h-0 overflow-hidden">
              <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      role="treegrid"
      aria-readonly={selectionMode === 'none' ? undefined : false}
      className={`overflow-auto rounded-xl border border-line [background-image:var(--wash)] shadow-[var(--ele-1)]${className ? ` ${className}` : ''}`}
    >
      {/* Header row — cùng grid template với body rows */}
      <div role="rowgroup" aria-hidden="false">
        <div
          role="row"
          style={{ gridTemplateColumns: selectionMode === 'checkbox' ? `40px ${gridCols}` : gridCols }}
          className="grid bg-s3"
        >
          {selectionMode === 'checkbox' && (
            <div role="columnheader" className={`${CELL} w-10`}>
              <Checkbox
                aria-label="Chọn tất cả"
                checked={allSelected}
                onChange={() => emitSelection(allSelected ? [] : collectKeys(data))}
              />
            </div>
          )}
          <div role="columnheader" className={CELL} aria-label="Mở rộng" />
          {columns.map((col) => (
            <div
              key={col.key}
              role="columnheader"
              className={`${CELL} font-semibold text-ink2 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>
      <div role="rowgroup">
        {data.length === 0 ? (
          <div role="row" style={{ gridTemplateColumns: '1fr' }}>
            <div role="gridcell" className={CELL}>
              {emptyMessage ?? <EmptyState title="Không có dữ liệu" />}
            </div>
          </div>
        ) : (
          data.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}
