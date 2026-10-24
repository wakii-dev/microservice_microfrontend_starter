// Tests array — chunk (đều/lẻ/edge), groupBy (đa nhóm/giữ thứ tự), flattenTree
// + findTreeNode (cây 3 tầng, không thấy → null).
import { describe, expect, it } from 'vitest';
import { chunk, findTreeNode, flattenTree, groupBy } from './array.js';

describe('chunk', () => {
  it('chia đều + khối cuối ngắn hơn', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('edge: mảng rỗng · size > length · size không hợp lệ throw', () => {
    expect(chunk([], 3)).toEqual([]);
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
    expect(() => chunk([1], 0)).toThrow(RangeError);
    expect(() => chunk([1], -2)).toThrow(RangeError);
  });

  it('không mutate input', () => {
    const src = [1, 2, 3];
    chunk(src, 2);
    expect(src).toEqual([1, 2, 3]);
  });
});

describe('groupBy', () => {
  it('nhóm theo keyFn, giữ thứ tự xuất hiện đầu', () => {
    const tasks = [
      { id: 1, status: 'todo' },
      { id: 2, status: 'doing' },
      { id: 3, status: 'todo' },
    ];
    expect(groupBy(tasks, (t) => t.status)).toEqual({
      todo: [tasks[0], tasks[2]],
      doing: [tasks[1]],
    });
  });

  it('mảng rỗng → object rỗng; khoá number vẫn hoạt động', () => {
    expect(groupBy([], (x: never) => x)).toEqual({});
    expect(groupBy([1, 2, 3], (n) => n % 2)).toEqual({ 1: [1, 3], 0: [2] });
  });
});

interface Node {
  name: string;
  children?: Node[];
}
const TREE: Node[] = [
  {
    name: 'a',
    children: [
      { name: 'a1', children: [{ name: 'a1x' }] },
      { name: 'a2' },
    ],
  },
  { name: 'b' },
];

describe('flattenTree', () => {
  it('DFS pre-order + depth đúng (gốc 0)', () => {
    expect(flattenTree(TREE).map((f) => [f.node.name, f.depth])).toEqual([
      ['a', 0],
      ['a1', 1],
      ['a1x', 2],
      ['a2', 1],
      ['b', 0],
    ]);
  });

  it('cây rỗng → []', () => {
    expect(flattenTree([])).toEqual([]);
  });
});

describe('findTreeNode', () => {
  it('thấy node tầng sâu (DFS pre-order trả node đầu tiên thoả)', () => {
    expect(findTreeNode(TREE, (n) => n.name === 'a1x')?.name).toBe('a1x');
    expect(findTreeNode(TREE, (n) => n.name.startsWith('a'))?.name).toBe('a');
  });

  it('không thấy → null', () => {
    expect(findTreeNode(TREE, (n) => n.name === 'zzz')).toBeNull();
  });
});
