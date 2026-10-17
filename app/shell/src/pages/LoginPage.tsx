import { FormEvent, KeyboardEvent, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ApiError, isExpired, tokenStorage } from '@wakii/fe-shared';
import { auth } from '../api';

type AuthMode = 'login' | 'register';

const TABS: ReadonlyArray<{ id: AuthMode; label: string }> = [
  { id: 'login', label: 'Đăng nhập' },
  { id: 'register', label: 'Đăng ký' },
];

/**
 * Login + Register (SF-4, VU-63) qua wrapper refresh-client — auth.yaml v2:
 * POST /api/auth/login|register → {user, accessToken, refreshToken} (không còn
 * tokenType/expiresIn). Wrapper lưu cặp token (access → tokenStorage, refresh →
 * localStorage['bp.rt']) — UI chỉ điều hướng. UI mới theo pattern Tailwind v4
 * hiện hành (utilities + theme vars, mirror Badge — KHÔNG css-scoped .sh-login cũ).
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);

  // Đã login (token còn hạn) → về trang chủ
  const token = tokenStorage.getToken();
  if (token && !isExpired(token)) {
    return <Navigate to="/" replace />;
  }

  function switchMode(next: AuthMode) {
    setError(null);
    setMode(next);
  }

  // Roving tabindex ARIA tabs: ArrowLeft/Right đổi tab + focus theo selection
  function handleTablistKeys(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next: AuthMode = mode === 'login' ? 'register' : 'login';
    switchMode(next);
    (next === 'login' ? loginTabRef : registerTabRef).current?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    // contract: password 8–72 ký tự (argon2 input limit, auth.yaml RegisterRequest)
    if (mode === 'register' && (password.length < 8 || password.length > 72)) {
      setError('Mật khẩu cần 8–72 ký tự.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await auth.login(email, password);
      } else {
        await auth.register(email, password, displayName);
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

  const inputClass = 'h-[34px] px-2.5'; // nền/viền/radius từ element defaults (base.css)

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
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-1 text-meta text-ink2">
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-meta text-ink2">
            Mật khẩu
            <input
              type="password"
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          {mode === 'register' && (
            <label className="flex flex-col gap-1 text-meta text-ink2">
              Tên hiển thị
              <input
                type="text"
                name="displayName"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-1 border border-st-fail bg-[color-mix(in_srgb,var(--st-fail)_10%,transparent)] px-2.5 py-1.5 text-meta text-st-fail"
            >
              {error}
            </p>
          )}
          <button
            className="mt-1 h-7 w-full rounded-2 bg-accent text-label font-medium text-white transition-colors hover:bg-accent-hi disabled:cursor-default disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
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
