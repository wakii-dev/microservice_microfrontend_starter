// Tests Users CRUD (redesign Drawer theo Templates/CRUD Table) — zod chặn form rỗng
// (lỗi hiện qua Field), tạo user hợp lệ qua Drawer, email fail@demo.local cố ý fail
// (mirror saga demo), Popconfirm xoá row + toast.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App.js';
import { ThemeProvider } from '../theme.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderUsers() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/users']}>
        <AppRoutes />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

async function openDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Thêm user/ }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
}

describe('Users — Drawer CRUD + zod', () => {
  it('submit form trống → lỗi zod "Tên bắt buộc" + "Email không hợp lệ" hiện', async () => {
    const user = userEvent.setup();
    renderUsers();
    await openDrawer(user);

    // Tạo user khi form rỗng → zod chặn
    await user.click(screen.getByRole('button', { name: 'Tạo user' }));

    expect(await screen.findByText('Tên bắt buộc')).toBeInTheDocument();
    expect(screen.getAllByText('Email không hợp lệ').length).toBeGreaterThan(0);
    // user chưa được thêm — alice vẫn ở đầu danh sách mock
    expect(await screen.findByText('alice@demo.local')).toBeInTheDocument();
  });

  it('điền hợp lệ + Tạo user → message thành công + user mới vào bảng (Đang mời)', async () => {
    const user = userEvent.setup();
    renderUsers();
    await openDrawer(user);

    // label 'Tên*'/'Email*' có dấu * required → match regex đầu chuỗi
    await user.type(screen.getByLabelText(/^Tên/), 'Test User');
    await user.type(screen.getByLabelText(/^Email/), 'test@demo.local');
    await user.click(screen.getByRole('button', { name: 'Tạo user' }));

    expect(await screen.findByText('Đã tạo Test User')).toBeInTheDocument();
    expect(await screen.findByText('test@demo.local')).toBeInTheDocument();
  });

  it('email fail@demo.local → message thất bại, không thêm vào bảng', async () => {
    const user = userEvent.setup();
    renderUsers();
    await openDrawer(user);

    await user.type(screen.getByLabelText(/^Tên/), 'Fail Case');
    await user.type(screen.getByLabelText(/^Email/), 'fail@demo.local');
    await user.click(screen.getByRole('button', { name: 'Tạo user' }));

    expect(await screen.findByText(/Thao tác thất bại/)).toBeInTheDocument();
    // email không xuất hiện trong bảng (input value không phải text node)
    expect(screen.queryByText('fail@demo.local')).not.toBeInTheDocument();
  });

  it('Popconfirm xoá row → user mất khỏi bảng + toast', async () => {
    const user = userEvent.setup();
    renderUsers();
    await screen.findByText('heidi@demo.local'); // đợi mock fetch render trang 1

    await user.click(screen.getByRole('button', { name: 'Xoá Heidi Bui' }));
    // Popconfirm ok button — name "Xoá" khớp exact (không đụng trigger "Xoá Heidi Bui")
    await user.click(screen.getByRole('button', { name: 'Xoá' }));

    expect(await screen.findByText('Đã xoá Heidi Bui')).toBeInTheDocument();
    expect(screen.queryByText('heidi@demo.local')).not.toBeInTheDocument();
  });
});
