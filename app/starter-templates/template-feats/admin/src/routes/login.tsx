// Login — trang bare (ngoài AdminLayout): logo W + form đăng nhập demo.
// Mật khẩu demo: demo-password (xem LoginContainer).
import { Text } from '@wakii/ui-kit';
import { LoginContainer } from '@/features/auth';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-line bg-s1 p-8">
        <div className="flex flex-col items-center gap-2">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-accent">
            {/* Logo mark "W" (wakii) — brand riêng của app scaffold. */}
            <svg viewBox="0 0 12 12" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M1.5 3l2.2 6L6 5.2 8.3 9l2.2-6" />
            </svg>
          </span>
          <h1 className="m-0 text-lg font-semibold text-ink">Đăng nhập {'{{appName}}'}</h1>
        </div>
        <LoginContainer />
        <p className="m-0 text-center text-meta text-ink3">
          Demo: mật khẩu <Text code>demo-password</Text>
        </p>
      </div>
    </div>
  );
}
