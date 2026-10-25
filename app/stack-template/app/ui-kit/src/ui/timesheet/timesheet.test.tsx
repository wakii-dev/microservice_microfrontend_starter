// Timesheet tests — hành vi: render grid + header theo locale, nhãn tuần vi/en,
// nav prev/next (kèm tuần mới + cross-month), onCellChange payload, tổng
// hàng/cột/grand, weekend shaded + vẫn edit được, readonly không input, loading skeleton.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Timesheet } from './index.js';

// Tue 20/10/2026 — tuần Thứ 2 19 → Chủ nhật 25/10/2026
const WEEK = new Date(2026, 9, 20);
const ROWS = [
  { key: 'task-a', label: 'Task A', meta: 'Design system', values: [8, 8, 8, 8, 8, null, null] },
  { key: 'task-b', label: 'Task B', meta: 'Gateway', values: [1, 2, 0.5, null, null, null, null] },
  { key: 'task-c', label: 'Task C', meta: 'e2e suite', values: [null, null, null, 4, 6, 3, null] },
];

afterEach(cleanup);

describe('Timesheet', () => {
  it('render rows + header 7 ngày (vi mặc định) + tổng hàng', () => {
    render(<Timesheet rows={ROWS} week={WEEK} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Design system')).toBeInTheDocument(); // meta dòng phụ
    expect(screen.getByText('T2')).toBeInTheDocument(); // cột Thứ 2 = 19/10
    expect(screen.getByText('CN')).toBeInTheDocument();
    expect(screen.getAllByText('8')).toHaveLength(5); // Task A T2–T6
    expect(screen.getByText('40')).toBeInTheDocument(); // tổng hàng Task A
    expect(screen.getByText('3.5')).toBeInTheDocument(); // 1 + 2 + 0.5
  });

  it('nhãn khoảng tuần vi: "19–25 Th10 2026"', () => {
    render(<Timesheet rows={ROWS} week={WEEK} />);
    expect(screen.getByText('19–25 Th10 2026')).toBeInTheDocument();
  });

  it('locale en: nhãn tuần "Oct 19–25, 2026" + header Mo…Su + aria nav', () => {
    render(<Timesheet rows={ROWS} week={WEEK} locale="en" />);
    expect(screen.getByText('Oct 19–25, 2026')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next week' })).toBeInTheDocument();
  });

  it('prev/next đổi tuần — bắn onWeekChange đúng Thứ 2, cross-month vi', async () => {
    const onWeekChange = vi.fn();
    const user = userEvent.setup();
    render(<Timesheet rows={ROWS} week={WEEK} onWeekChange={onWeekChange} />);
    await user.click(screen.getByRole('button', { name: 'Tuần trước' }));
    expect(screen.getByText('12–18 Th10 2026')).toBeInTheDocument();
    expect(onWeekChange).toHaveBeenLastCalledWith(new Date(2026, 9, 12));
    await user.click(screen.getByRole('button', { name: 'Tuần sau' }));
    await user.click(screen.getByRole('button', { name: 'Tuần sau' }));
    expect(screen.getByText('26 Th10–1 Th11 2026')).toBeInTheDocument(); // vắt tháng
    expect(onWeekChange).toHaveBeenLastCalledWith(new Date(2026, 9, 26));
  });

  it('editable: gõ vào ô → onCellChange(rowKey, dayIndex, giá trị clamp)', async () => {
    const onCellChange = vi.fn();
    const user = userEvent.setup();
    render(<Timesheet rows={ROWS} week={WEEK} editable onCellChange={onCellChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Thứ 3 20/10 · Task B' });
    await user.clear(input); // xoá → null
    await user.type(input, '3.5');
    expect(onCellChange).toHaveBeenLastCalledWith('task-b', 1, 3.5);
  });

  it('tổng cột (footer) + grand total tính đúng, có tabular-nums', () => {
    render(<Timesheet rows={ROWS} week={WEEK} />);
    // cột: 9, 10, 8.5, 12, 14, 3, 0 — grand 56.5
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('56.5')).toBeInTheDocument();
    const grand = screen.getByText('56.5');
    expect(grand).toHaveClass('tabular-nums');
    expect(grand).toHaveClass('font-semibold');
  });

  it('ô cuối tuần shaded (bg-s3/60) + vẫn edit được khi editable', async () => {
    const onCellChange = vi.fn();
    const user = userEvent.setup();
    render(<Timesheet rows={ROWS} week={WEEK} editable onCellChange={onCellChange} />);
    const sat = screen.getByRole('spinbutton', { name: 'Thứ 7 24/10 · Task B' });
    expect(sat.closest('td')).toHaveClass('bg-s3/60');
    await user.type(sat, '2');
    expect(onCellChange).toHaveBeenLastCalledWith('task-b', 5, 2);
  });

  it('readonly: không có input; ô null hiển thị trống', () => {
    render(<Timesheet rows={ROWS} week={WEEK} />);
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.getByLabelText('Thứ 7 24/10 · Task A')).toHaveTextContent('');
  });

  it('loading: skeleton thay thân bảng, header + nhãn tuần giữ nguyên', () => {
    render(<Timesheet rows={ROWS} week={WEEK} loading />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0); // Skeleton bones
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(screen.queryByText('40')).not.toBeInTheDocument();
    expect(screen.getByText('19–25 Th10 2026')).toBeInTheDocument();
  });
});
