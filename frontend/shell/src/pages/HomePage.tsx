import { Link } from 'react-router';
import { isExpired, readClaims, tokenStorage } from '@boilerplate/fe-shared';

/**
 * Dashboard chào (spec slice mục 4): greeting + quick links 2 remote + demo hints.
 * Giữ h1 "Trang chủ" (integration test contract). fail@demo.local = fixture saga 4b
 * (gán task cho user này → assignment FAIL → badge "Gán thất bại", SF-3 demo).
 */
export function HomePage() {
  const token = tokenStorage.getToken();
  const claims = token && !isExpired(token) ? readClaims(token) : null;

  return (
    <section className="sh-home">
      <header className="sh-home__head">
        <h1 className="sh-home__title">Trang chủ</h1>
        <p className="sh-home__sub">
          Chào {claims?.email ?? 'bạn'} — shell tổng hợp 2 remote (tasks, activity) qua module
          federation.
        </p>
      </header>

      <div className="sh-home__grid">
        <Link className="sh-home__card" to="/tasks">
          <h2>Tasks</h2>
          <p>Quản lý công việc — tạo, sửa, đổi status, filter.</p>
        </Link>
        <Link className="sh-home__card" to="/activity">
          <h2>Activity</h2>
          <p>Feed sự kiện real-time (Kafka) — mọi thao tác ở Tasks đều phản ánh về đây.</p>
        </Link>
      </div>

      <div className="sh-home__hints">
        <p className="sh-home__hints-title">Tài khoản demo</p>
        <ul>
          <li>
            <code>alice@demo.local</code> / <code>demo-password</code> — tài khoản chính
          </li>
          <li>
            <code>fail@demo.local</code> — gán task cho user này để xem saga: badge
            {" "}
            <em>“Gán thất bại”</em>
          </li>
        </ul>
      </div>
    </section>
  );
}
