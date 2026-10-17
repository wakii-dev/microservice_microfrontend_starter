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
    <section className="flex min-h-[calc(100vh-52px-48px)] items-center justify-center max-md:min-h-0 max-md:py-8">
      <div className="w-[min(340px,100%)] rounded-3 border border-line bg-s2 p-8">
        <div className="mb-4 flex items-center gap-2.5">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-2 bg-accent">
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
          <span className="text-h1 font-semibold tracking-[-0.01em]">Boilerplate</span>
        </div>
        <h1 className="m-0 mb-4 text-h2 font-semibold text-ink2">Đăng nhập</h1>
        <form aria-label="Form đăng nhập" className="flex flex-col gap-3" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-meta text-ink2">
            Email
            <Input
              type="email"
              autoComplete="username"
              required
              {...register('email')}
            />
          </label>
          <label className="flex flex-col gap-1 text-meta text-ink2">
            Mật khẩu
            <Input
              type="password"
              autoComplete="current-password"
              required
              {...register('password')}
            />
          </label>
          {errors.root && <Alert type="error" message={errors.root.message} />}
          <Button type="primary" htmlType="submit" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
        <p className="m-0 mt-4 text-center text-meta text-ink3">
          Demo: <code className="font-mono text-meta text-ink">alice@demo.local</code> / <code className="font-mono text-meta text-ink">demo-password</code> (mock — dev password
          chung)
        </p>
      </div>
    </section>
  );
}
