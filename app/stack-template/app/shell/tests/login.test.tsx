import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { tokenStorage } from '@wakii/fe-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/pages/LoginPage';

// SF-4 (VU-63): LoginPage đi qua wrapper refresh-client (auth trong src/api) — test
// mock-fetch TẦNG fetch (timeoutFetch bind lazy nên vi.stubGlobal có hiệu lực),
// response shape v2 {user, accessToken, refreshToken} (auth.yaml v2 — không còn
// tokenType/expiresIn). Chain thật: form → auth.login/register → tokenStorage + bp.rt.

const ENVELOPE_401 = {
  error: { code: 'UNAUTHORIZED', message: 'bad credentials', requestId: null, details: null },
};
const ENVELOPE_409 = {
  error: { code: 'CONFLICT', message: 'email already registered', requestId: null, details: null },
};

function jwt(): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', email: 'alice@demo.local', roles: ['admin'], exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

function session() {
  return {
    user: { id: 'u1', email: 'alice@demo.local', displayName: 'Alice', roles: ['admin'] },
    accessToken: jwt(),
    refreshToken: 'rt-1',
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function stubFetch(handler: (url: string, body: unknown) => Response) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    return Promise.resolve(handler(String(input), body));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  // tokenStorage giữ memoryToken module-level — phải clearToken (không chỉ localStorage)
  // nếu không test kế thừa token cũ → LoginPage early-return Navigate → render rỗng
  tokenStorage.clearToken();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Mật khẩu'), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

describe('LoginPage — login (shape v2)', () => {
  it('login thành công → lưu cặp token (bp.jwt + bp.rt), gọi đúng endpoint', async () => {
    const fetchMock = stubFetch((url) =>
      url === '/api/auth/login' ? jsonResponse(200, session()) : jsonResponse(404, null),
    );

    renderLogin();
    await fillAndSubmit('alice@demo.local', 'demo-password');

    await waitFor(() => {
      expect(window.localStorage.getItem('bp.jwt')).toBe(session().accessToken);
    });
    expect(window.localStorage.getItem('bp.rt')).toBe('rt-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/login');
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'alice@demo.local', password: 'demo-password' });
  });

  it('sai mật khẩu (401) → hiện lỗi, KHÔNG lưu token', async () => {
    stubFetch(() => jsonResponse(401, ENVELOPE_401));

    renderLogin();
    await fillAndSubmit('alice@demo.local', 'wrong');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.');
    });
    expect(window.localStorage.getItem('bp.jwt')).toBeNull();
    expect(window.localStorage.getItem('bp.rt')).toBeNull();
  });

  it('lỗi server khác (500) → hiện message từ error envelope', async () => {
    stubFetch(() =>
      jsonResponse(500, {
        error: { code: 'INTERNAL', message: 'Máy chủ bận.', requestId: null, details: null },
      }),
    );

    renderLogin();
    await fillAndSubmit('alice@demo.local', 'demo-password');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Máy chủ bận.');
    });
  });

  it('lỗi mạng → thông báo không kết nối được', async () => {
    stubFetch(() => {
      throw new TypeError('Failed to fetch');
    });

    renderLogin();
    await fillAndSubmit('alice@demo.local', 'demo-password');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Không kết nối được máy chủ đăng nhập.');
    });
  });
});

describe('LoginPage — tab Đăng ký (SF-4)', () => {
  it('register thành công → POST /api/auth/register đủ 3 trường + lưu cặp token', async () => {
    const fetchMock = stubFetch((url) =>
      url === '/api/auth/register'
        ? jsonResponse(201, {
            user: { id: 'u2', email: 'new@demo.local', displayName: 'Nguyen Van A', roles: ['user'] },
            accessToken: jwt(),
            refreshToken: 'rt-new',
          })
        : jsonResponse(404, null),
    );

    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Đăng ký' }));

    await user.type(screen.getByLabelText('Email'), 'new@demo.local');
    await user.type(screen.getByLabelText('Mật khẩu'), 'sup-secret-1');
    await user.type(screen.getByLabelText('Tên hiển thị'), 'Nguyen Van A');
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('bp.jwt')).toBeTruthy();
    });
    expect(window.localStorage.getItem('bp.rt')).toBe('rt-new');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/auth/register');
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'new@demo.local',
      password: 'sup-secret-1',
      displayName: 'Nguyen Van A',
    });
  });

  it('email trùng (409) → hiện lỗi đã đăng ký, KHÔNG lưu token', async () => {
    stubFetch(() => jsonResponse(409, ENVELOPE_409));

    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Đăng ký' }));
    await user.type(screen.getByLabelText('Email'), 'alice@demo.local');
    await user.type(screen.getByLabelText('Mật khẩu'), 'demo-password');
    await user.type(screen.getByLabelText('Tên hiển thị'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email này đã được đăng ký.');
    });
    expect(window.localStorage.getItem('bp.jwt')).toBeNull();
  });

  it('password ngắn hơn 8 ký tự → chặn ở FE (Mật khẩu cần 8–72 ký tự), không gọi mạng', async () => {
    const fetchMock = stubFetch(() => jsonResponse(201, session()));

    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Đăng ký' }));
    await user.type(screen.getByLabelText('Email'), 'new@demo.local');
    await user.type(screen.getByLabelText('Mật khẩu'), 'short');
    await user.type(screen.getByLabelText('Tên hiển thị'), 'A');
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu cần 8–72 ký tự.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('đổi tab qua lại giữ các tab aria-selected đúng (tablist a11y)', async () => {
    renderLogin();
    const user = userEvent.setup();
    const loginTab = screen.getByRole('tab', { name: 'Đăng nhập' });
    const registerTab = screen.getByRole('tab', { name: 'Đăng ký' });

    expect(loginTab).toHaveAttribute('aria-selected', 'true');
    await user.click(registerTab);
    expect(registerTab).toHaveAttribute('aria-selected', 'true');
    expect(loginTab).toHaveAttribute('aria-selected', 'false');
    // form register hiện (label Tên hiển thị), form login ẩn
    expect(screen.getByLabelText('Tên hiển thị')).toBeInTheDocument();
    await user.click(loginTab);
    expect(screen.queryByLabelText('Tên hiển thị')).not.toBeInTheDocument();
  });
});

describe('LoginPage — render + redirect', () => {
  it('render login card: wordmark Boilerplate + heading Đăng nhập + hint demo', () => {
    renderLogin();
    expect(screen.getByText('Boilerplate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByText(/alice@demo\.local/)).toBeInTheDocument();
  });

  it('đã có token hợp lệ → redirect về trang chủ, không render form', () => {
    window.localStorage.setItem('bp.jwt', jwt());
    renderLogin();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });
});
