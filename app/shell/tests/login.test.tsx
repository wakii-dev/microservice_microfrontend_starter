import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ApiError } from '@boilerplate/fe-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/api';
import { LoginPage } from '../src/pages/LoginPage';

// Mock TẦNG api (không mạng): api.ts bind fetch gốc lúc module-load nên vi.stubGlobal
// không ăn — mock module là điểm cắt đúng cho unit test LoginPage.
vi.mock('../src/api', () => ({
  api: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.clearAllMocks();
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('login thành công → token lưu vào localStorage (key bp.jwt)', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ accessToken: 'fake.jwt.token', tokenType: 'Bearer', expiresIn: 28800 });

    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'alice@demo.local');
    await user.type(screen.getByLabelText('Mật khẩu'), 'demo-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('bp.jwt')).toBe('fake.jwt.token');
    });
    // gọi đúng endpoint contract (contracts/openapi/auth.yaml /login)
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'alice@demo.local',
      password: 'demo-password',
    });
  });

  it('sai mật khẩu (401) → hiện lỗi, KHÔNG lưu token', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(
      new ApiError(401, {
        error: { code: 'UNAUTHORIZED', message: 'bad credentials', requestId: null, details: null },
      }),
    );

    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'alice@demo.local');
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.');
    });
    expect(window.localStorage.getItem('bp.jwt')).toBeNull();
  });

  it('render login card: wordmark Boilerplate + heading Đăng nhập + hint demo (SF-2 visual)', () => {
    renderLogin();
    expect(screen.getByText('Boilerplate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByText(/alice@demo\.local/)).toBeInTheDocument();
  });

  it('lỗi mạng → thông báo không kết nối được', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(new TypeError('Failed to fetch'));

    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'alice@demo.local');
    await user.type(screen.getByLabelText('Mật khẩu'), 'demo-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Không kết nối được máy chủ đăng nhập.');
    });
  });
});
