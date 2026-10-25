// Tests kanban utils — groupByColumn (failed vào đầu todo) · sortTasks · pickColumn.
import { describe, expect, it } from 'vitest';
import type { Task } from '../../api';
import { groupByColumn, pickColumn, sortTasks } from './utils.js';

function task(partial: Partial<Task> & { id: string }): Task {
  return {
    title: `Task ${partial.id}`,
    description: null,
    status: 'todo',
    assigneeId: null,
    createdBy: 'u1',
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    ...partial,
  };
}

const rect = (left: number, top: number, right: number, bottom: number) =>
  ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top }) as DOMRect;

describe('groupByColumn', () => {
  it('nhóm 3 status; assignment_failed vào ĐẦU cột todo (status hệ thống, không drag)', () => {
    const grouped = groupByColumn([
      task({ id: 'a', status: 'todo' }),
      task({ id: 'f', status: 'assignment_failed' }),
      task({ id: 'b', status: 'in_progress' }),
      task({ id: 'c', status: 'done' }),
    ]);
    // assignment_failed KHÔNG nằm trong 3 cột writable (slim column riêng ở board)
    expect(grouped.todo.map((t) => t.id)).toEqual(['a']);
    expect(grouped.in_progress.map((t) => t.id)).toEqual(['b']);
    expect(grouped.done.map((t) => t.id)).toEqual(['c']);
  });
});

describe('sortTasks', () => {
  it('newest theo updatedAt desc; oldest đảo; không mutate input', () => {
    const a = task({ id: 'a', updatedAt: '2026-10-19T00:00:00Z' });
    const b = task({ id: 'b', updatedAt: '2026-10-21T00:00:00Z' });
    const input = [a, b];
    expect(sortTasks(input, 'newest').map((t) => t.id)).toEqual(['b', 'a']);
    expect(sortTasks(input, 'oldest').map((t) => t.id)).toEqual(['a', 'b']);
    expect(input.map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('pickColumn', () => {
  const rects = {
    todo: rect(0, 0, 200, 400),
    in_progress: rect(210, 0, 410, 400),
    done: null as DOMRect | null,
  };
  it('điểm trúng cột → status đó', () => {
    expect(pickColumn({ x: 100, y: 200 }, rects)).toBe('todo');
    expect(pickColumn({ x: 300, y: 200 }, rects)).toBe('in_progress');
  });
  it('ngoài mọi cột / cột rect null → null', () => {
    expect(pickColumn({ x: 500, y: 200 }, rects)).toBeNull();
    expect(pickColumn({ x: 350, y: 200 }, { done: null })).toBeNull();
  });
});
