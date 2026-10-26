// Smoke test mẫu — render Home không crash + đúng tiêu đề. Mock CỔNG feature
// (route chỉ phụ thuộc hợp đồng index.ts): HomePage render stub, không fetch.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './home';

vi.mock('@/features/tasks', () => ({
  TasksPageContainer: () => <div>tasks-table-stub</div>,
  TaskFormContainer: () => <div>task-form-stub</div>,
}));

describe('HomePage', () => {
  it('render tiêu đề + 2 container của feature tasks qua index', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Tasks');
    expect(screen.getByText('tasks-table-stub')).toBeInTheDocument();
    expect(screen.getByText('task-form-stub')).toBeInTheDocument();
  });
});
