// Tests Users form (batch ⑦) — submit thiếu field → lỗi zod hiện qua Field (role=alert);
// điền hợp lệ → message thành công.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderUsers() {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Users — Modal CRUD + zod', () => {
  it('submit form trống → lỗi zod "Tên bắt buộc" + "Email không hợp lệ" hiện', async () => {
    const user = userEvent.setup();
    renderUsers();

    await user.click(screen.getByRole('button', { name: /Thêm user/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Lưu khi form rỗng → zod chặn
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Tên bắt buộc')).toBeInTheDocument();
    expect(screen.getAllByText('Email không hợp lệ').length).toBeGreaterThan(0);
    // user chưa được thêm — vẫn chỉ có alice ở đầu danh sách mock
    expect(screen.getByText('alice@demo.local')).toBeInTheDocument();
  });

  it('điền hợp lệ + Lưu → message thành công + user mới vào bảng', async () => {
    const user = userEvent.setup();
    renderUsers();

    await user.click(screen.getByRole('button', { name: /Thêm user/ }));
    // label 'Tên*'/'Email*' có dấu * required → match regex đầu chuỗi
    await user.type(screen.getByLabelText(/^Tên/), 'Test User');
    await user.type(screen.getByLabelText(/^Email/), 'test@demo.local');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Đã tạo Test User')).toBeInTheDocument();
    expect(screen.getByText('test@demo.local')).toBeInTheDocument();
  });

  it('email fail@demo.local → message thất bại (demo saga fail)', async () => {
    const user = userEvent.setup();
    renderUsers();

    await user.click(screen.getByRole('button', { name: /Thêm user/ }));
    await user.type(screen.getByLabelText(/^Tên/), 'Fail Case');
    await user.type(screen.getByLabelText(/^Email/), 'fail@demo.local');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText(/Thao tác thất bại/)).toBeInTheDocument();
    expect(screen.queryByText('fail@demo.local')).not.toBeInTheDocument(); // không add
  });
});
