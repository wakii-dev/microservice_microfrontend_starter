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
