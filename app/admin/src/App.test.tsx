// Tests routing admin (batch ⑦) — render 3 route qua MemoryRouter + AppRoutes.
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from './App.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-bp-theme');
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Admin routing', () => {
  it('/ → Dashboard: heading + 4 thẻ thống kê + sidebar menu', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Người dùng')).toBeInTheDocument();
    expect(screen.getByText('Tasks đang mở')).toBeInTheDocument();
    expect(screen.getByText('File upload')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
    // sidebar đa cấp
    expect(screen.getByText('Quản lý')).toBeInTheDocument();
    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
  });

  it('/users → bảng Users + nút Thêm user + dữ liệu mock', () => {
    renderAt('/users');

    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm user/ })).toBeInTheDocument();
    expect(screen.getByText('alice@demo.local')).toBeInTheDocument();
    // Select filter — trigger là role=combobox với aria-label (button+listbox pattern)
    expect(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' })).toBeInTheDocument();
  });

  it('/settings → Tabs Cài đặt với 2 tab', () => {
    renderAt('/settings');

    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeInTheDocument();
    expect(screen.getByText('Chung')).toBeInTheDocument();
    expect(screen.getByText('Vùng & thông báo')).toBeInTheDocument();
    // field tab Chung render mặc định (label có dấu * vì required → match regex)
    expect(screen.getByLabelText(/^Tên site/)).toBeInTheDocument();
  });
});
