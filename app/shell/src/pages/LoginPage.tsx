import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { ApiError, isExpired, tokenStorage } from '@wakii/fe-shared';
import { Alert, Button, Card, Field, Icon, Input, Tabs, useForm } from '@wakii/ui-kit';
import { auth } from '../api';

type AuthMode = 'login' | 'register';

const AUTH_TABS: ReadonlyArray<{ id: AuthMode; label: string }> = [
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
 * Redesign shell-kit (2026-10-27): khung thẻ là Card kit, tabs Đăng nhập/Đăng ký
 * là Tabs kit (line style, roving tabindex + ArrowLeft/Right/Home/End do kit lo —
 * ARIA tabs pattern giữ nguyên contract test), lỗi server hiển thị qua Alert kit
 * (role=alert). Form vẫn useForm + zod (mode onSubmit), Field/Input/Button kit.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  async function submit(data: AuthFormValues) {
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
  }

  // Nội dung panel theo mode — Tabs kit chỉ render tab active (form instance
  // sống ở hook phía trên nên values giữ nguyên qua lần đổi tab).
  function renderPanel(current: AuthMode) {
    return (
      <>
        <h1 className="mb-4 text-h2 font-semibold text-ink2">
          {current === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </h1>
        <form
          aria-label={current === 'login' ? 'Form đăng nhập' : 'Form đăng ký'}
          className="flex flex-col gap-3"
          onSubmit={form.handleSubmit(submit)}
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
              autoComplete={current === 'login' ? 'current-password' : 'new-password'}
              value={form.values.password}
              invalid={!!form.errors.password}
              onChange={form.handleChange('password')}
            />
          </Field>
          {current === 'register' && (
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
          {error && <Alert type="error" variant="outlined" message={error} />}
          <Button
            className="mt-1 w-full"
            htmlType="submit"
            loading={submitting}
            disabled={submitting}
            block
          >
            {current === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </Button>
        </form>
      </>
    );
  }

  return (
    <section className="flex min-h-[calc(100vh-100px)] items-center justify-center">
      <Card className="w-full max-w-[340px]">
        <div className="mb-4 flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-2 bg-accent text-white"
          >
            <Icon name="menu-bars" size={12} />
          </span>
          <span className="text-h1 font-semibold tracking-tight text-ink">Boilerplate</span>
        </div>

        <Tabs
          activeKey={mode}
          onChange={(key) => switchMode(key as AuthMode)}
          items={AUTH_TABS.map((tab) => ({
            key: tab.id,
            label: tab.label,
            children: renderPanel(tab.id),
          }))}
        />

        {mode === 'login' && (
          <p className="mt-4 text-center text-meta text-ink3">
            Demo: <code>alice@demo.local</code> / <code>demo-password</code> — hoặc đăng ký tài
            khoản mới ở tab Đăng ký
          </p>
        )}
      </Card>
    </section>
  );
}
