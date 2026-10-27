// private — trang DEMO guard: login giả qua localStorage, minh hoạ ProtectedRoute.
// Có auth thật thì thay `demoSignedIn()` bằng check token của bạn.
import { Link, Text, Title } from '@wakii/ui-kit';

const KEY = 'demo-private-signed-in';

export const demoSignedIn = (): boolean => localStorage.getItem(KEY) === '1';
export const demoSignOut = (): void => localStorage.removeItem(KEY);

export default function PrivatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-label font-semibold uppercase tracking-[0.1em] text-accent">Demo</span>
        <Title level={1}>Khu vực riêng tư</Title>
      </div>
      <Text type="secondary">
        Trang này nằm sau <Text code>ProtectedRoute</Text> — điều kiện demo là key localStorage{' '}
        <Text code>{KEY}</Text>. Đăng xuất rồi vào lại <Text code>/private</Text> bằng nav để thấy redirect.
      </Text>
      <Link to="/" onClick={demoSignOut}>
        Đăng xuất (demo) và về Home
      </Link>
    </div>
  );
}
