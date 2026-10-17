import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { tokenStorage } from '@boilerplate/fe-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/api';
import { AppRoutes } from '../src/App';

// Integration cross-cutting (plan T6): login → nav → remote-down fallback.
// Mock TẦNG api (login) + loadRemoteModule (remote down) — không mạng, không remote thật.
const loadRemoteModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@boilerplate/fe-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@boilerplate/fe-shared')>();
  return { ...actual, loadRemoteModule: loadRemoteModuleMock };
});
vi.mock('../src/api', () => ({
  api: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const FAKE_TOKEN = `.${btoa(JSON.stringify({ sub: 'u1', email: 'alice@demo.local', roles: ['admin'], exp: Math.floor(Date.now() / 1000) + 3600 }))}.sig`;

afterEach(() => {
  cleanup();
  // tokenStorage giữ memoryToken module-level — clearToken xoá CẢ memory + localStorage
  // (chỉ clear localStorage là leak token giữa các test → RequireAuth nhìn thấy auth cũ)
  tokenStorage.clearToken();
  loadRemoteModuleMock.mockReset();
  vi.clearAllMocks();
});

describe('integration: login → nav → remote-down fallback', () => {
  it('login xong thấy email trên nav; vào /tasks remote down → fallback, app không crash', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ accessToken: FAKE_TOKEN, tokenType: 'Bearer', expiresIn: 28800 });
    loadRemoteModuleMock.mockRejectedValue(new Error('Remote "tasks" load failed'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // 1) login
    await user.type(screen.getByLabelText('Email'), 'alice@demo.local');
    await user.type(screen.getByLabelText('Mật khẩu'), 'demo-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    // 2) về trang chủ, nav hiện email từ JWT claims
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument();
    });
    expect(screen.getByTestId('nav-user')).toHaveTextContent('alice@demo.local');

    // 3) nav sang /tasks — remote down → error boundary fallback (không trắng trang)
    await user.click(screen.getByRole('link', { name: 'Tasks' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Không tải được phần tasks');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();

    // 4) app vẫn sống — nav hoạt động trở lại /activity cũng fallback tương tự
    await user.click(screen.getByRole('link', { name: 'Activity' }));
    const alert2 = await screen.findByRole('alert');
    expect(alert2).toHaveTextContent('Không tải được phần activity');
  });

  it('chưa login vào /tasks → redirect /login', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    });
  });
});
