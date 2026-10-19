// array — util mảng/cây (utils wave 2026-10-18): chunk chia lô, groupBy gom nhóm,
// flattenTree + findTreeNode phục vụ consumer Tree/TreeTable (đầu ra phẳng kèm
// depth/path để render_indent + breadcrumb không phải walk đệ quy lại).

/** Chia mảng thành các lô `size` phần tử: chunk([1,2,3,4,5], 2) → [[1,2],[3,4],[5]].
 * size < 1 → mảng rỗng (chống vòng lặp vô hạn); size > length → 1 lô duy nhất. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Gom nhóm phần tử theo key: groupBy(users, u => u.role) → Record<role, user[]>.
 * Giữ thứ tự gặp đầu tiên của từng nhóm. */
export function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (out[key] ??= []).push(item);
  }
  return out;
}

export interface TreeNodeLike {
  key: string;
  children?: TreeNodeLike[];
}

export interface FlatTreeNode<T extends TreeNodeLike> {
  /** Node gốc (giữ nguyên mọi field — consumer đọc label/values tuỳ ý). */
  node: T;
  /** Độ sâu: root = 0. */
  depth: number;
  /** Chuỗi key từ root đến node (bao gồm chính nó) — dùng làm breadcrumb/indent path. */
  path: string[];
}

/** Dẹt hoá cây đệ quy theo thứ tự pre-order (cha trước con): đầu ra phẳng kèm
 * depth + path — Tree/TreeTable consumer render indent/breadcrumb không walk lại.
 * Cây 3 cấp: root(0) → con(1) → cháu(2). */
export function flattenTree<T extends TreeNodeLike>(nodes: T[]): FlatTreeNode<T>[] {
  const out: FlatTreeNode<T>[] = [];
  const walk = (list: T[], depth: number, path: string[]) => {
    for (const node of list) {
      const nextPath = [...path, node.key];
      out.push({ node, depth, path: nextPath });
      if (node.children?.length) walk(node.children as T[], depth + 1, nextPath);
    }
  };
  walk(nodes, 0, []);
  return out;
}

/** Tìm node đầu tiên khớp predicate (DFS cha trước con). Không thấy → null. */
export function findTreeNode<T extends TreeNodeLike>(nodes: T[], predicate: (node: T) => boolean): T | null {
  for (const node of nodes) {
    if (predicate(node)) return node;
    if (node.children?.length) {
      const found = findTreeNode(node.children as T[], predicate);
      if (found) return found;
    }
  }
  return null;
}
