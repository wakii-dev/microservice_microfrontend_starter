// ui test mẫu — RTL với props CỨNG (không mock data layer): component thuần
// nhận props là hợp đồng duy nhất cần assert.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_STATUS_LABEL, type Task } from '../schema/schema';
import { TasksPage } from './TasksPage';

const FIXED_TASKS: Task[] = [
  { id: 1, title: 'Đọc AGENTS.md', status: 'done', assignee: 'alice', createdAt: '2026-01-10T08:00:00.000Z' },
  { id: 2, title: 'Thêm feature đầu tiên', status: 'doing', assignee: null, createdAt: '2026-01-11T08:00:00.000Z' },
];

describe('TasksPage', () => {
  it('render bảng với props cứng: tiêu đề + nhãn trạng thái + nút xoá', () => {
    render(<TasksPage tasks={FIXED_TASKS} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Đọc AGENTS.md')).toBeInTheDocument();
    expect(screen.getByText('Thêm feature đầu tiên')).toBeInTheDocument();
    expect(screen.getByText(TASK_STATUS_LABEL.done)).toBeInTheDocument();
    expect(screen.getByText(TASK_STATUS_LABEL.doing)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xoá task Đọc AGENTS.md' })).toBeInTheDocument();
  });

  it('error → Alert thay bảng', () => {
    render(<TasksPage tasks={[]} error="Mạng gãy" onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Không tải được danh sách task')).toBeInTheDocument();
    expect(screen.queryByText('Đọc AGENTS.md')).not.toBeInTheDocument();
  });
});
