// OrgChart — cây tổ chức dọc (PrimeReact OrganizationChart lite): root trên, con
// hàng dưới. Connector thuần CSS: đường dọc ngắn từ cha + đường ngang GHÉP từ
// nửa trái/phải từng cột con (first → nửa phải, last → nửa trái, giữa → full) —
// không JS đo đạc. Node card bo góc; type 'dept' | 'person' đổi nền + icon.
// Collapse subtree: chevron góc card, Set keys uncontrolled (mặc định mở hết).
// A11y: role=tree/treeitem/group, aria-expanded trên treeitem, aria-selected.
import classNames from 'classnames';
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface OrgChartNodeData {
  key: string;
  label: ReactNode;
  /** 'dept' = nền s3 + semibold + icon menu-bars; 'person' (mặc định) = bg-s2 + icon user. */
  type?: 'person' | 'dept';
  children?: OrgChartNodeData[];
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface OrgChartClassNames {
  /** Div cuộn ngang gốc. */
  root?: string;
  /** <ul role="tree"> / <ul role="group"> (áp mọi cấp). */
  tree?: string;
  /** <li role="treeitem"> (áp mọi cấp). */
  item?: string;
  /** Button card node (áp cả selected). */
  node?: string;
  /** Button chevron gập/mở nhánh. */
  toggle?: string;
}

export interface OrgChartProps {
  /** Node gốc (đơn — con render hàng dưới qua children). */
  data: OrgChartNodeData;
  /** Key node đang chọn (controlled) — viền accent + aria-selected. */
  selectedKey?: string;
  onSelect?: (key: string) => void;
  /** Keys gập sẵn lúc mount (subtree ẩn — collapse qua chevron góc card). */
  defaultCollapsedKeys?: string[];
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: OrgChartClassNames;
}

/* Connector ngang: mỗi cột con vẽ nửa đường của mình trên mép trên (top-0) —
 * các cột kề nhau ghép thành 1 đường liền; first chỉ nửa phải, last chỉ nửa trái. */
const H_LINE =
  "before:absolute before:top-0 before:h-px before:bg-line before:content-['']";
const H_LINE_EDGE = 'first:before:left-1/2 first:before:right-0 last:before:left-0 last:before:right-1/2';

function OrgNode({
  node,
  isChild,
  selectedKey,
  onSelect,
  collapsed,
  toggle,
  slots,
}: {
  node: OrgChartNodeData;
  /** con (không phải root) → connector dọc + nửa đường ngang. */
  isChild: boolean;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  collapsed: Set<string>;
  toggle: (key: string) => void;
  slots?: OrgChartClassNames;
}) {
  const hasChildren = !!node.children?.length;
  const isCollapsed = collapsed.has(node.key);
  const selected = node.key === selectedKey;
  const typeCls =
    node.type === 'dept'
      ? 'bg-s3 font-semibold text-ink'
      : 'bg-s2 text-ink';
  const toggleLabel =
    typeof node.label === 'string' ? `Gập/mở ${node.label}` : 'Gập/mở nhánh';

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? !isCollapsed : undefined}
      aria-selected={selected}
      className={classNames('relative flex list-none flex-col items-center', isChild && `px-6 ${H_LINE} ${H_LINE_EDGE}`, slots?.item)}
    >
      {isChild && <span aria-hidden="true" className="h-4 w-px bg-line" />}
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={() => onSelect?.(node.key)}
          className={classNames(
            'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-4 py-2 text-body shadow-[var(--shadow-pop)] transition-[background-color,box-shadow,border-color] duration-150 hover:shadow-[var(--shadow-lift)] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none',
            selected ? 'border-accent ring-1 ring-accent/40' : 'border-line',
            typeCls,
            slots?.node,
          )}
        >
          <Icon name={node.type === 'dept' ? 'menu-bars' : 'user'} size={12} className="shrink-0 text-ink3" />
          {node.label}
        </button>
        {hasChildren && (
          <button
            type="button"
            aria-label={toggleLabel}
            onClick={() => toggle(node.key)}
            className={classNames('cursor-pointer rounded-pill border-none bg-transparent p-0.5 text-ink3 transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none', slots?.toggle)}
          >
            <span
              aria-hidden="true"
              className={`inline-block transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            >
              <Icon name="chevron-down" size={12} />
            </span>
          </button>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <>
          <span aria-hidden="true" className="h-4 w-px bg-line" />
          <ul role="group" className={classNames('m-0 flex list-none items-start p-0', slots?.tree)}>
            {node.children!.map((child) => (
              <OrgNode
                key={child.key}
                node={child}
                isChild
                selectedKey={selectedKey}
                onSelect={onSelect}
                collapsed={collapsed}
                toggle={toggle}
                slots={slots}
              />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

export function OrgChart(props: OrgChartProps) {
  const { data, selectedKey, onSelect, defaultCollapsedKeys = [], className, style } = props;
  const slots = props.classNames;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(defaultCollapsedKeys));

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className={classNames('overflow-x-auto', slots?.root, className)} style={style}>
      <ul
        role="tree"
        aria-label={typeof data.label === 'string' ? data.label : 'Organization chart'}
        className={classNames('m-0 inline-flex list-none justify-center p-0', slots?.tree)}
      >
        <OrgNode node={data} isChild={false} selectedKey={selectedKey} onSelect={onSelect} collapsed={collapsed} toggle={toggle} slots={slots} />
      </ul>
    </div>
  );
}
