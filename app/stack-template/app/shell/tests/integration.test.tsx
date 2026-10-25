import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { tokenStorage } from '@wakii/fe-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/App';

// Integration cross-cutting (plan T6): login → nav → remote-down fallback.
// SF-4: login đi qua wrapper refresh-client → mock TẦNG fetch (timeoutFetch bind
// lazy nên vi.stubGlobal có hiệu lực) thay vì mock module api; loadRemoteModule
// vẫn mock (remote down) — không mạng, không remote thật.
const loadRemoteModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@wakii/fe-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@wakii/fe-shared')>();
  return { ...actual, loadRemoteModule: loadRemoteModuleMock };
});

const FAKE_TOKEN = `.${btoa(JSON.stringify({ sub: 'u1', email: 'alice@demo.local', roles: ['admin'], exp: Math.floor(Date.now() / 1000) + 3600 }))}.sig`;

function stubLoginFetch() {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    if (String(input) === '/api/auth/login' && body?.email === 'alice@demo.local') {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            user: { id: 'u1', email: 'alice@demo.local', displayName: 'Alice', roles: ['admin'] },
            accessToken: FAKE_TOKEN,
            refreshToken: 'rt-1',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }
    return Promise.resolve(new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'x', requestId: null, details: null } }), { status: 404 }));
  });
}

afterEach(() => {
  cleanup();
  // tokenStorage giữ memoryToken module-level — clearToken xoá CẢ memory + localStorage
  // (chỉ clear localStorage là leak token giữa các test → RequireAuth nhìn thấy auth cũ)
  tokenStorage.clearToken();
  loadRemoteModuleMock.mockReset();
  vi.unstubAllGlobals();
});

describe('integration: login → nav → remote-down fallback', () => {
  it('login xong thấy email trên nav; vào /tasks remote down → fallback, app không crash', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', stubLoginFetch());
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

    // 2) về trang chủ (landing redesign — hero heading mới), nav hiện email từ JWT claims
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Ship full-stack, not tooling' })).toBeInTheDocument();
    });
    expect(screen.getByTestId('nav-user')).toHaveTextContent('alice@demo.local');

    // 3) nav sang /tasks — remote down → error boundary fallback (không trắng trang).
    // Landing thêm footer link cùng tên → nav là link đầu trong DOM.
    await user.click(screen.getAllByRole('link', { name: 'Tasks' })[0]!);
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
