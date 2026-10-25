// Mention tests — gõ @ → dropdown gợi ý, query lọc, chọn → chèn "@Name " +
// onChange + đóng; không @ / không match → không dropdown.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mention } from './index.js';

const PEOPLE = ['An', 'Binh', 'Chi'];

afterEach(cleanup);

describe('Mention', () => {
  it('gõ @ → dropdown hiện gợi ý; không @ → không dropdown', async () => {
    const user = userEvent.setup();
    render(<Mention suggestions={PEOPLE} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello');
    expect(screen.queryByText('@An')).toBeNull();
    await user.type(textarea, ' @');
    expect(screen.getByText('@An')).toBeInTheDocument();
    expect(screen.getByText('@Binh')).toBeInTheDocument();
    expect(screen.getByText('@Chi')).toBeInTheDocument();
  });

  it('query sau @ lọc gợi ý', async () => {
    const user = userEvent.setup();
    render(<Mention suggestions={PEOPLE} />);
    await user.type(screen.getByRole('textbox'), 'hey @c');
    expect(screen.getByText('@Chi')).toBeInTheDocument();
    expect(screen.queryByText('@An')).toBeNull();
  });

  it('chọn mention → chèn "@Name " vào value + onChange + dropdown đóng', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Mention suggestions={PEOPLE} onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hi @');
    await user.click(screen.getByText('@An'));
    expect(onChange).toHaveBeenLastCalledWith('hi @An ');
    expect(textarea).toHaveValue('hi @An ');
    expect(screen.queryByText('@Binh')).toBeNull();
  });

  it('chèn mention vào text có sẵn — splice đúng vị trí @, bỏ query chưa hoàn tất', async () => {
    const user = userEvent.setup();
    render(<Mention suggestions={PEOPLE} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'x @an');
    expect(screen.getByText('@An')).toBeInTheDocument();
    await user.click(screen.getByText('@An'));
    expect(textarea).toHaveValue('x @An ');
    expect(screen.queryByText('@Binh')).toBeNull();
  });

  it('@ không khớp ai → không dropdown', async () => {
    const user = userEvent.setup();
    render(<Mention suggestions={PEOPLE} />);
    await user.type(screen.getByRole('textbox'), '@zzz');
    expect(screen.queryByText('@An')).toBeNull();
  });
});

describe('Mention — keyboard nav (audit fix)', () => {
  it('ArrowDown + Enter → chọn gợi ý đang active (không xuống dòng)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Mention suggestions={PEOPLE} onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hi @');
    await user.keyboard('{ArrowDown}'); // active 0 → 1 = Binh
    expect(screen.getByText('@Binh')).toHaveClass('bg-s3');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('hi @Binh ');
    expect(screen.queryByText('@An')).toBeNull(); // dropdown đóng
  });

  it('Escape đóng dropdown', async () => {
    const user = userEvent.setup();
    render(<Mention suggestions={PEOPLE} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@');
    expect(screen.getByText('@An')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('@An')).toBeNull();
  });
});
