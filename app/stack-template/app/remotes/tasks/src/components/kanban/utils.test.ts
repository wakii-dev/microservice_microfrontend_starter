// Tests kanban utils — groupByColumn (failed tách khỏi 3 cột) · sortTasks ·
// assigneeInitials cho Avatar card. (pickColumn đã bỏ — drag do kit board lo.)
import { describe, expect, it } from 'vitest';
import type { Task } from '../../api';
import { assigneeInitials, groupByColumn, sortTasks } from './utils.js';

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

describe('groupByColumn', () => {
  it('nhóm 3 status; assignment_failed KHÔNG nằm trong 3 cột (slim column riêng ở board)', () => {
    const grouped = groupByColumn([
      task({ id: 'a', status: 'todo' }),
      task({ id: 'f', status: 'assignment_failed' }),
      task({ id: 'b', status: 'in_progress' }),
      task({ id: 'c', status: 'done' }),
    ]);
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

describe('assigneeInitials (Avatar card)', () => {
  it('rút 2 ký tự đầu khỏi id — uppercase, bỏ dấu gạch', () => {
    expect(assigneeInitials('33333333-3333-3333-3333-333333333333')).toBe('33');
    expect(assigneeInitials('ab-cd')).toBe('AB');
  });
  it('id rỗng/null → null (card render "Chưa gán")', () => {
    expect(assigneeInitials(null)).toBeNull();
    expect(assigneeInitials('')).toBeNull();
    expect(assigneeInitials('---')).toBeNull();
  });
});
