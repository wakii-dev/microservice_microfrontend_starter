import { useMemo, useState, KeyboardEvent, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { ApiError, isExpired, tokenStorage } from '@wakii/fe-shared';
import { Button, Field, Input, useForm } from '@wakii/ui-kit';
import { auth } from '../api';

type AuthMode = 'login' | 'register';

const TABS: ReadonlyArray<{ id: AuthMode; label: string }> = [
  { id: 'login', label: 'Đăng nhập' },
  { id: 'register', label: 'Đăng ký' },
];

/* Schema zod tiếng Việt — validation chuyển sang useForm (batch ⑰):
 * login: chỉ bắt buộc; register: contract auth.yaml — password 8–72 (argon2 limit). */
const loginSchema = z.object({
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu bắt buộc'),
});
const registerSchema = z.object({
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu cần 8–72 ký tự.').max(72, 'Mật khẩu cần 8–72 ký tự.'),
  displayName: z.string().min(1, 'Tên hiển thị bắt buộc'),
});

type AuthFormValues = { email: string; password: string; displayName?: string };

/**
 * Login + Register (SF-4, VU-63) qua wrapper refresh-client — auth.yaml v2.
 * Batch ⑰ (VU-53): form chuyển sang useForm + zod + Field/Input/Button ui-kit —
 * validation FE khai báo bằng schema (mode onSubmit), server error vẫn role=alert
 * riêng phía trên nút submit. ARIA tabs + roving tabindex giữ nguyên (a11y contract).
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);

  const schema = useMemo(() => (mode === 'login' ? loginSchema : registerSchema), [mode]);
  const form = useForm<AuthFormValues>({
    schema,
    initialValues: { email: '', password: '', displayName: '' },
    mode: 'onSubmit',
  });

  // Đã login (token còn hạn) → về trang chủ
  const token = tokenStorage.getToken();
  if (token && !isExpired(token)) {
    return <Navigate to="/" replace />;
  }

  function switchMode(next: AuthMode) {
    setError(null);
    setMode(next);
    // xoá FE errors khi đổi mode (schema khác) — giữ nguyên values người dùng đang gõ
    form.reset({ email: form.values.email, password: form.values.password, displayName: form.values.displayName });
  }

  // Roving tabindex ARIA tabs: ArrowLeft/Right đổi tab + focus theo selection
  function handleTablistKeys(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next: AuthMode = mode === 'login' ? 'register' : 'login';
    switchMode(next);
    (next === 'login' ? loginTabRef : registerTabRef).current?.focus();
  }

  return (
    <section className="flex min-h-[calc(100vh-100px)] items-center justify-center">
      <div className="w-full max-w-[340px] rounded-3 border border-line bg-s2 p-8">
        <div className="mb-4 flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-2 bg-accent"
          >
            <svg
              viewBox="0 0 16 16"
              className="size-3"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 4.5h7M3 8h10M3 11.5h5" />
            </svg>
          </span>
          <span className="text-h1 font-semibold tracking-tight text-ink">Boilerplate</span>
        </div>

        <div
          role="tablist"
          aria-label="Chế độ đăng nhập hoặc đăng ký"
          className="mb-4 flex gap-1 rounded-pill bg-s3 p-1"
          onKeyDown={handleTablistKeys}
        >
          {TABS.map((tab) => {
            const selected = mode === tab.id;
            return (
              <button
                key={tab.id}
                ref={tab.id === 'login' ? loginTabRef : registerTabRef}
                role="tab"
                id={`auth-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`auth-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                type="button"
                onClick={() => switchMode(tab.id)}
                className={`flex-1 rounded-pill px-3 py-1 text-label transition-colors ${
                  selected
                    ? 'bg-s1 font-medium text-ink shadow-sm'
                    : 'text-ink3 hover:text-ink2'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <h1 id={`auth-panel-${mode}`} className="mb-4 text-h2 font-semibold text-ink2">
          {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </h1>
        <form
          aria-labelledby={`auth-tab-${mode}`}
          className="flex flex-col gap-3"
          onSubmit={form.handleSubmit(async (data) => {
            setError(null);
            setSubmitting(true);
            try {
              if (mode === 'login') {
                await auth.login(data.email, data.password);
              } else {
                await auth.register(data.email, data.password, data.displayName!);
              }
              const from = (location.state as { from?: string } | null)?.from ?? '/';
              navigate(from, { replace: true });
            } catch (err) {
              if (err instanceof ApiError) {
                if (err.status === 401 && mode === 'login') {
                  setError('Email hoặc mật khẩu không đúng.');
                } else if (err.status === 409) {
                  setError('Email này đã được đăng ký. Chuyển sang tab Đăng nhập để đăng nhập.');
                } else {
                  setError(err.message);
                }
              } else {
                setError('Không kết nối được máy chủ đăng nhập.');
              }
            } finally {
              setSubmitting(false);
            }
          })}
        >
          <Field label="Email" htmlFor="auth-email" error={form.errors.email}>
            <Input
              id="auth-email"
              type="email"
              name="email"
              autoComplete="username"
              value={form.values.email}
              invalid={!!form.errors.email}
              onChange={form.handleChange('email')}
            />
          </Field>
          <Field label="Mật khẩu" htmlFor="auth-password" error={form.errors.password}>
            <Input
              id="auth-password"
              type="password"
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={form.values.password}
              invalid={!!form.errors.password}
              onChange={form.handleChange('password')}
            />
          </Field>
          {mode === 'register' && (
            <Field
              label="Tên hiển thị"
              htmlFor="auth-display-name"
              error={form.errors.displayName}
            >
              <Input
                id="auth-display-name"
                type="text"
                name="displayName"
                autoComplete="name"
                value={form.values.displayName}
                invalid={!!form.errors.displayName}
                onChange={form.handleChange('displayName')}
              />
            </Field>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-1 border border-st-fail bg-[color-mix(in_srgb,var(--st-fail)_10%,transparent)] px-2.5 py-1.5 text-meta text-st-fail"
            >
              {error}
            </p>
          )}
          <Button
            className="mt-1 w-full"
            htmlType="submit"
            loading={submitting}
            disabled={submitting}
            block
          >
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </Button>
        </form>
        {mode === 'login' && (
          <p className="mt-4 text-center text-meta text-ink3">
            Demo: <code>alice@demo.local</code> / <code>demo-password</code> — hoặc đăng ký tài
            khoản mới ở tab Đăng ký
          </p>
        )}
      </div>
    </section>
  );
}
