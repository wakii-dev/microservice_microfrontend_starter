// Tests admin redesign — smoke 3 trang sample (Dashboard · CRUD Users · Settings)
// + theme toggle qua ThemeProvider/UiKitProvider: attr data-bp-theme trên scope
// provider (không còn documentElement như bản cũ) + persist localStorage.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from './App.js';
import { ThemeProvider } from './theme.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('Admin smoke — 3 trang sample', () => {
  it('/ → Dashboard: heading + KPI Statistic + bảng tasks + timeline (fetch mock)', async () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    // fetch mock ~150ms → đợi marker chỉ có SAU khi data về (KPI Statistic title;
    // Card title 'Tasks gần đây' render ngay cả khi đang skeleton nên không đợi được)
    expect(await screen.findByText('Tasks đóng tuần này')).toBeInTheDocument();
    expect(screen.getByText('Gateway CORS whitelist')).toBeInTheDocument();
    expect(screen.getByText('Timeline hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Saga gán thất bại → task-events.dlq')).toBeInTheDocument();
  });

  it('/users → CRUD showcase: heading + nút Thêm user + bảng mock + filter', async () => {
    renderAt('/users');

    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm user/ })).toBeInTheDocument();
    expect(await screen.findByText('alice@demo.local')).toBeInTheDocument();
    // Select filter — trigger là role=combobox với aria-label (button+listbox pattern)
    expect(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Lọc theo vai trò' })).toBeInTheDocument();
    expect(screen.getByText('Tổng user')).toBeInTheDocument();
  });

  it('/settings → rail menu + panel Tài khoản + vùng nguy hiểm', () => {
    renderAt('/settings');

    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeInTheDocument();
    // rail 5 nhóm
    expect(screen.getByText('Tài khoản')).toBeInTheDocument();
    expect(screen.getByText('Chung')).toBeInTheDocument();
    expect(screen.getByText('Bảo mật')).toBeInTheDocument();
    expect(screen.getByText('Thông báo')).toBeInTheDocument();
    expect(screen.getByText('Giao diện')).toBeInTheDocument();
    // panel mặc định Tài khoản + danger zone
    expect(screen.getByText('Hồ sơ')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Tên hiển thị/)).toBeInTheDocument();
    expect(screen.getByText('Vùng nguy hiểm')).toBeInTheDocument();
  });

  it('/settings → tab Giao diện: Segmented chủ đề + preview dark live', async () => {
    const user = userEvent.setup();
    renderAt('/settings');

    await user.click(screen.getByText('Giao diện'));

    expect(screen.getByText('Chủ đề')).toBeInTheDocument();
    // Segmented = radiogroup (role=radio cho từng option)
    expect(screen.getByRole('radio', { name: 'Sáng' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tối' })).toBeInTheDocument();
    expect(screen.getByText('Xem trước dark')).toBeInTheDocument();
    expect(screen.getByText('Màu nhận diện')).toBeInTheDocument();
  });
});

describe('Theme — ThemeProvider qua UiKitProvider', () => {
  it('toggle dark → attr data-bp-theme=dark trên scope provider + persist localStorage', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await screen.findByText('Tasks đóng tuần này'); // đợi fetch mock xong cho ổn định

    await user.click(screen.getByRole('button', { name: 'Bật dark mode' }));

    // attr nằm trên scope div của UiKitProvider (CSS var cascade xuống toàn app)
    expect(document.querySelector('[data-bp-theme="dark"]')).not.toBeNull();
    expect(window.localStorage.getItem('admin-theme')).toContain('dark');

    // CSS vars thật được verify bằng playwright probe (scripts/verify-chart.mjs)
    await user.click(screen.getByRole('button', { name: 'Tắt dark mode' }));
    expect(document.querySelector('[data-bp-theme="dark"]')).toBeNull();
  });
});
