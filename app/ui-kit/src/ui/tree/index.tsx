// Tree — lite recursive expand/collapse (hướng A, 0 deps).
// GIỚI HẠN: không virtual scroll, không drag-drop, không multi-select (backlog).
import { useState } from 'react';
import { Icon } from '../icons';

export interface TreeNodeData {
  /** Khả định duy nhất của node (React key + toggle state). */
  key: string;
  /** Nhãn hiển thị. */
  label: string;
  /** Có children → node expand/collapse được. */
  children?: TreeNodeData[];
}

export interface TreeProps {
  /** Dữ liệu cây (đệ quy). */
  data: TreeNodeData[];
  /** Node mở sẵn lúc mount. */
  defaultExpandedKeys?: string[];
  /** Đường nối cấp con — border-l trên ul group (antd showLine). */
  showLine?: boolean;
  /** Callback click node (cả node lá lẫn node cha). */
  onNodeClick?: (key: string) => void;
  className?: string;
}

function TreeNode({ node, depth, expanded, onToggle, onClick, showLine }: {
  node: TreeNodeData; depth: number;
  expanded: Set<string>; onToggle: (k: string) => void;
  onClick?: (k: string) => void; showLine?: boolean;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded.has(node.key);
  return (
    <li>
      <button type="button" role="treeitem" aria-expanded={hasChildren ? isOpen : undefined}
        onClick={() => { if (hasChildren) onToggle(node.key); onClick?.(node.key); }}
        className={`flex w-full cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2 py-1 text-left text-body text-ink hover:bg-s3 active:opacity-80 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${depth > 0 ? 'pl-6' : ''}`}>
        {hasChildren && <span aria-hidden="true" className={`text-ink3 transition-transform ${isOpen ? 'rotate-90' : ''}`}><Icon name="chevron-right" size={12} /></span>}
        {node.label}
      </button>
      {hasChildren && isOpen && (
        <ul role="group" className={`m-0 list-none p-0 ${showLine ? 'ml-3 border-l border-line pl-1' : ''}`}>
          {node.children!.map((child) => (
            <TreeNode key={child.key} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onClick={onClick} showLine={showLine} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Tree({ data, defaultExpandedKeys = [], showLine = false, onNodeClick, className }: TreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpandedKeys));
  return (
    <ul role="tree" className={`m-0 list-none p-0${className ? ` ${className}` : ''}`}>
      {data.map((node) => (
        <TreeNode key={node.key} node={node} depth={0} expanded={expanded}
          onToggle={(k) => setExpanded((p) => {
            const n = new Set(p);
            if (n.has(k)) n.delete(k); else n.add(k);
            return n;
          })}
          onClick={onNodeClick} showLine={showLine} />
      ))}
    </ul>
  );
}
