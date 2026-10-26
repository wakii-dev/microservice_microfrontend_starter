// Inplace tests — click display → edit mode (children), ✕ → display + onClose.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Inplace } from './index.js';

afterEach(cleanup);

describe('Inplace', () => {
  it('mặc định đóng — display trong nút; children ẩn', () => {
    render(
      <Inplace display="Tên: Alice">
        <input aria-label="Sửa tên" defaultValue="Alice" />
      </Inplace>,
    );
    expect(screen.getByText('Tên: Alice')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sửa tên')).toBeNull();
  });

  it('click display → edit mode: children hiện, display biến mất', async () => {
    const user = userEvent.setup();
    render(
      <Inplace display="Tên: Alice">
        <input aria-label="Sửa tên" defaultValue="Alice" />
      </Inplace>,
    );
    await user.click(screen.getByText('Tên: Alice'));
    expect(screen.getByLabelText('Sửa tên')).toBeInTheDocument();
    expect(screen.queryByText('Tên: Alice')).toBeNull();
  });

  it('nút ✕ → về display + onClose gọi', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Inplace display="Tên: Alice" onClose={onClose}>
        <input aria-label="Sửa tên" defaultValue="Alice" />
      </Inplace>,
    );
    await user.click(screen.getByText('Tên: Alice'));
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Tên: Alice')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sửa tên')).toBeNull();
  });

  it('edit mode: gõ trong children hoạt động bình thường (form tự quản)', async () => {
    const user = userEvent.setup();
    render(
      <Inplace display="Tên: Alice">
        <input aria-label="Sửa tên" defaultValue="Alice" />
      </Inplace>,
    );
    await user.click(screen.getByText('Tên: Alice'));
    await user.type(screen.getByLabelText('Sửa tên'), ' Bob');
    expect(screen.getByLabelText('Sửa tên')).toHaveValue('Alice Bob');
  });
});

describe('Inplace — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root / display (đóng) rồi content + close (mở)', async () => {
    const user = userEvent.setup();
    render(
      <Inplace
        display="Tên: Alice"
        classNames={{ root: 'slot-root', display: 'slot-display', content: 'slot-content', close: 'slot-close' }}
      >
        <input aria-label="Sửa tên" />
      </Inplace>,
    );
    const root = screen.getByText('Tên: Alice').parentElement!;
    expect(root).toHaveClass('slot-root');
    expect(screen.getByText('Tên: Alice')).toHaveClass('slot-display');
    await user.click(screen.getByText('Tên: Alice'));
    expect(screen.getByLabelText('Sửa tên').parentElement).toHaveClass('slot-content');
    expect(screen.getByRole('button', { name: 'Đóng' })).toHaveClass('slot-close');
  });

  it('style passthrough lên root + không truyền slots → mở → đóng vẫn onClose (behavior giữ nguyên)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Inplace display="Tên: Alice" onClose={onClose} style={{ margin: '8px' }} className="user-last">
        <input aria-label="Sửa tên" />
      </Inplace>,
    );
    const root = screen.getByText('Tên: Alice').parentElement as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThanOrEqual(0);
    await user.click(screen.getByText('Tên: Alice'));
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Tên: Alice')).toBeInTheDocument();
  });
});
