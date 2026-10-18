import { Link } from 'react-router';
import { isExpired, readClaims, tokenStorage } from '@wakii/fe-shared';
import { Icon } from '@wakii-dev/ui-kit';

/**
 * Dashboard chào (spec slice mục 4): greeting + quick links 2 remote + demo hints.
 * Giữ h1 "Trang chủ" (integration test contract). fail@demo.local = fixture saga 4b
 * (gán task cho user này → assignment FAIL → badge "Gán thất bại", SF-3 demo).
 */
export function HomePage() {
  const token = tokenStorage.getToken();
  const claims = token && !isExpired(token) ? readClaims(token) : null;

  return (
    <section className="flex flex-col gap-6">
      <header className="sh-home__head">
        <h1 className="m-0 text-h1 font-semibold tracking-[-0.01em]">Trang chủ</h1>
        <p className="mt-1 text-ink2">
          Chào {claims?.email ?? 'bạn'} — shell tổng hợp 2 remote (tasks, activity) qua module
          federation.
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Link className="flex flex-col gap-2 rounded-3 border border-line bg-s2 p-6 text-inherit no-underline transition-colors hover:border-line2 hover:bg-s3" to="/tasks">
          <span aria-hidden="true" className="text-accent">
            <Icon name="check-circle" size={20} />
          </span>
          <h2 className="m-0">Tasks</h2>
          <p className="m-0">Quản lý công việc — tạo, sửa, đổi status, filter.</p>
        </Link>
        <Link className="flex flex-col gap-2 rounded-3 border border-line bg-s2 p-6 text-inherit no-underline transition-colors hover:border-line2 hover:bg-s3" to="/activity">
          <span aria-hidden="true" className="text-accent">
            <Icon name="clock" size={20} />
          </span>
          <h2 className="m-0">Activity</h2>
          <p className="m-0">Feed sự kiện real-time (Kafka) — mọi thao tác ở Tasks đều phản ánh về đây.</p>
        </Link>
      </div>

      <div className="rounded-3 border border-line p-6 text-label text-ink2">
        <p className="mb-2 text-meta uppercase tracking-[0.06em] text-ink3">Tài khoản demo</p>
        <ul className="m-0 flex flex-col gap-1 pl-4">
          <li>
            <code className="font-mono text-meta text-ink">alice@demo.local</code> / <code className="font-mono text-meta text-ink">demo-password</code> — tài khoản chính
          </li>
          <li>
            <code className="font-mono text-meta text-ink">fail@demo.local</code> — gán task cho user này để xem saga: badge
            {" "}
            <em>“Gán thất bại”</em>
          </li>
        </ul>
      </div>
    </section>
  );
}
