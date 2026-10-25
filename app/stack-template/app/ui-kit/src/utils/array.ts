// array — helper mảng + cây (0 deps, strict): chunk · groupBy · flattenTree ·
// findTreeNode. Không mutate input; generic giữ typecaller.

export interface FlatTreeNode<T> {
  /** Node hiện tại (không clone — tham chiếu gốc). */
  node: T;
  /** Độ sâu: gốc = 0. */
  depth: number;
}

/** Chia mảng thành các khối `size` phần tử (khối cuối có thể ngắn hơn).
 * size <= 0 → throw RangeError (lỗi gọi sai phải lộ sớm). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError(`chunk: size phải là số nguyên dương, nhận ${size}`);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Nhóm theo khoá sinh từ `keyFn` — thứ tự nhóm theo lần xuất hiện đầu. */
export function groupBy<T, K extends string | number>(items: readonly T[], keyFn: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (out[key] ??= []).push(item);
  }
  return out;
}

/** Phẳng cây (DFS pre-order) thành danh sách kèm depth — gốc depth 0.
 * Node có `children` rỗng/undefined thì không sinh con. */
export function flattenTree<T extends { children?: readonly T[] }>(nodes: readonly T[], depth = 0): Array<FlatTreeNode<T>> {
  const out: Array<FlatTreeNode<T>> = [];
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length) out.push(...flattenTree(node.children, depth + 1));
  }
  return out;
}

/** Tìm node đầu tiên thoả `predicate` — DFS pre-order; không thấy → null. */
export function findTreeNode<T extends { children?: readonly T[] }>(nodes: readonly T[], predicate: (node: T) => boolean): T | null {
  for (const node of nodes) {
    if (predicate(node)) return node;
    if (node.children?.length) {
      const hit = findTreeNode(node.children, predicate);
      if (hit) return hit;
    }
  }
  return null;
}
