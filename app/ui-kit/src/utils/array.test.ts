// array tests — chunk biên size 0/lớn, groupBy, flattenTree 3 cấp (depth+path), findTreeNode.
import { describe, expect, it } from 'vitest';
import { chunk, findTreeNode, flattenTree, groupBy } from './array.js';

interface Node {
  key: string;
  children?: Node[];
}

const TREE: Node[] = [
  {
    key: 'root',
    children: [
      { key: 'src', children: [{ key: 'app', children: [{ key: 'main' }] }] },
      { key: 'docs' },
    ],
  },
];

describe('chunk', () => {
  it('chia lô đều + lô cuối lệch: [1..5] size 2 → [[1,2],[3,4],[5]]', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('biên size 0 → rỗng; size > length → 1 lô duy nhất', () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('mảng rỗng → rỗng', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe('groupBy', () => {
  it('gom nhóm theo key giữ thứ tự gặp đầu', () => {
    const users = [
      { name: 'A', role: 'admin' },
      { name: 'B', role: 'user' },
      { name: 'C', role: 'admin' },
    ];
    expect(groupBy(users, (u) => u.role)).toEqual({
      admin: [{ name: 'A', role: 'admin' }, { name: 'C', role: 'admin' }],
      user: [{ name: 'B', role: 'user' }],
    });
  });

  it('mảng rỗng → object rỗng', () => {
    expect(groupBy([], (x: string) => x)).toEqual({});
  });

  it('keyFn phái sinh (theo thuộc tính tính toán) + nhóm nhiều phần tử giữ thứ tự', () => {
    const words = ['ba', 'ab', 'abc', 'xy'];
    const byLength = groupBy(words, (w) => (w.length > 2 ? 'dài' : 'ngắn'));
    expect(byLength['dài']).toEqual(['abc']);
    expect(byLength['ngắn']).toEqual(['ba', 'ab', 'xy']);
  });
});

describe('flattenTree', () => {
  it('cây 3 cấp → pre-order với depth 0/1/2/3 + path đầy đủ', () => {
    const flat = flattenTree(TREE);
    expect(flat.map((f) => f.node.key)).toEqual(['root', 'src', 'app', 'main', 'docs']);
    expect(flat.map((f) => f.depth)).toEqual([0, 1, 2, 3, 1]);
    expect(flat[3].path).toEqual(['root', 'src', 'app', 'main']);
  });

  it('path node lá giữa đúng breadcrumb: docs → ["root", "docs"]', () => {
    const flat = flattenTree(TREE);
    expect(flat[4].path).toEqual(['root', 'docs']);
  });

  it('mảng rỗng → rỗng', () => {
    expect(flattenTree([])).toEqual([]);
  });
});

describe('findTreeNode', () => {
  it('tìm node sâu 3 cấp (DFS); không thấy → null', () => {
    expect(findTreeNode(TREE, (n) => n.key === 'main')?.key).toBe('main');
    expect(findTreeNode(TREE, (n) => n.key === 'nope')).toBeNull();
  });

  it('ưu tiên cha trước con khi cả hai khớp', () => {
    expect(findTreeNode(TREE, (n) => n.key.startsWith('src'))?.key).toBe('src');
  });

  it('DFS qua nhiều root: match ở root sau vẫn tìm thấy; match root trước thắng', () => {
    const forest: Node[] = [{ key: 'a', children: [{ key: 'target-a' }] }, { key: 'b', children: [{ key: 'target-b' }] }];
    expect(findTreeNode(forest, (n) => n.key.startsWith('target'))?.key).toBe('target-a');
    expect(findTreeNode(forest, (n) => n.key === 'target-b')?.key).toBe('target-b');
  });
});
