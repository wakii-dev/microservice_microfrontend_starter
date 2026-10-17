// Tree — lite recursive expand/collapse (hướng A, 0 deps).
// GIỚI HẠN: không virtual scroll, không drag-drop, không multi-select (backlog).
import { useState } from 'react';

export interface TreeNodeData {
  key: string;
  label: string;
  children?: TreeNodeData[];
}

export interface TreeProps {
  data: TreeNodeData[];
  defaultExpandedKeys?: string[];
  onNodeClick?: (key: string) => void;
  className?: string;
}

function TreeNode({ node, depth, expanded, onToggle, onClick }: {
  node: TreeNodeData; depth: number;
  expanded: Set<string>; onToggle: (k: string) => void;
  onClick?: (k: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded.has(node.key);
  return (
    <li>
      <button type="button" aria-expanded={hasChildren ? isOpen : undefined}
        onClick={() => { if (hasChildren) onToggle(node.key); onClick?.(node.key); }}
        className={`flex w-full cursor-pointer items-center gap-1 rounded-2 border-none bg-transparent px-2 py-1 text-left text-body text-ink hover:bg-s3 ${depth > 0 ? 'pl-6' : ''}`}>
        {hasChildren && <span aria-hidden="true" className={`text-[10px] text-ink3 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>}
        {node.label}
      </button>
      {hasChildren && isOpen && (
        <ul className="m-0 list-none p-0">
          {node.children!.map((child) => (
            <TreeNode key={child.key} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onClick={onClick} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Tree({ data, defaultExpandedKeys = [], onNodeClick, className }: TreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpandedKeys));
  return (
    <ul role="tree" className={`m-0 list-none p-0${className ? ` ${className}` : ''}`}>
      {data.map((node) => (
        <TreeNode key={node.key} node={node} depth={0} expanded={expanded}
          onToggle={(k) => setExpanded((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; })}
          onClick={onNodeClick} />
      ))}
    </ul>
  );
}
