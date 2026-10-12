import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ApiError, isExpired, tokenStorage } from '@boilerplate/fe-shared';
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
    <section>
      <h1>Đăng nhập</h1>
      <form onSubmit={handleSubmit} aria-label="Form đăng nhập">
        <label>
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
        <label>
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
          <p role="alert" className="error-banner">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
      <p>
        <small>Demo: alice@demo.local / demo-password (mock — dev password chung)</small>
      </p>
    </section>
  );
}
