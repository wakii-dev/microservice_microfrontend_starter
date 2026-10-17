import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ApiError, isExpired, tokenStorage } from '@wakii/fe-shared';
import { api } from '../api';

interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

/**
 * Login mock JWT qua auth-mock (contract: contracts/openapi/auth.yaml):
 * POST /api/auth/login {email, password} → {accessToken, tokenType, expiresIn}.
 * Token lưu qua tokenStorage (fe-shared, READ-ONLY) — mọi api call sau đó tự đính Authorization.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Đã login (token còn hạn) → về trang chủ
  const token = tokenStorage.getToken();
  if (token && !isExpired(token)) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<LoginResponse>('/api/auth/login', { email, password });
      tokenStorage.setToken(res.accessToken);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Email hoặc mật khẩu không đúng.' : err.message);
      } else {
        setError('Không kết nối được máy chủ đăng nhập.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="sh-login">
      <div className="sh-login__card">
        <div className="sh-login__brand">
          <span aria-hidden="true" className="sh-login__mark">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 4.5h7M3 8h10M3 11.5h5" />
            </svg>
          </span>
          <span className="sh-login__wordmark">Boilerplate</span>
        </div>
        <h1 className="sh-login__title">Đăng nhập</h1>
        <form aria-label="Form đăng nhập" className="sh-login__form" onSubmit={handleSubmit}>
          <label className="sh-field">
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="sh-field">
            Mật khẩu
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          <button className="sh-btn sh-btn--primary sh-login__submit" type="submit" disabled={submitting}>
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
        <p className="sh-login__hint">
          Demo: <code>alice@demo.local</code> / <code>demo-password</code> (mock — dev password
          chung)
        </p>
      </div>
    </section>
  );
}
