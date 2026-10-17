import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ApiError, isExpired, tokenStorage } from '@wakii/fe-shared';
import { Alert, Button, Input } from '@wakii/ui-kit';
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
  // RHF (libs adopt): email/password + root error (banner 401/message) — submitting
  // = formState.isSubmitting.
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>({
    defaultValues: { email: '', password: '' },
  });

  // Đã login (token còn hạn) → về trang chủ
  const token = tokenStorage.getToken();
  if (token && !isExpired(token)) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await api.post<LoginResponse>('/api/auth/login', values);
      tokenStorage.setToken(res.accessToken);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError('root', {
          message: err.status === 401 ? 'Email hoặc mật khẩu không đúng.' : err.message,
        });
      } else {
        setError('root', { message: 'Không kết nối được máy chủ đăng nhập.' });
      }
    }
  });

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
        <form aria-label="Form đăng nhập" className="sh-login__form" onSubmit={onSubmit}>
          <label className="sh-field">
            Email
            <Input
              type="email"
              autoComplete="username"
              required
              {...register('email')}
            />
          </label>
          <label className="sh-field">
            Mật khẩu
            <Input
              type="password"
              autoComplete="current-password"
              required
              {...register('password')}
            />
          </label>
          {errors.root && <Alert type="error" message={errors.root.message} />}
          <Button
            type="primary"
            htmlType="submit"
            className="sh-login__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
        <p className="sh-login__hint">
          Demo: <code>alice@demo.local</code> / <code>demo-password</code> (mock — dev password
          chung)
        </p>
      </div>
    </section>
  );
}
