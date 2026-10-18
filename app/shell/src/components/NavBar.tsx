import { Link, NavLink, useNavigate } from 'react-router';
import { isExpired, readClaims, tokenStorage } from '@wakii/fe-shared';
import { Button } from 'wakii-ui-kit';
import { auth } from '../api';

/**
 * App chrome (hand-off §4): brand + nav + user chip/logout — Tailwind (P3 migration).
 * Active state: NavLink tự set aria-current="page" — visual = gạch accent 2px dưới
 * (after: utilities). Đọc token MỖI render (không useState cache) — login/logout
 * navigate là re-render trigger, nav cập nhật email ngay.
 */
const NAV_LINK =
  "relative flex items-center self-stretch rounded-2 px-2.5 text-label no-underline text-ink3 transition-colors hover:text-ink2 aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-2 aria-[current=page]:after:right-2 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-[1px] aria-[current=page]:after:bg-accent aria-[current=page]:after:content-['']";

export function NavBar() {
  const navigate = useNavigate();
  const token = tokenStorage.getToken();
  const claims = token && !isExpired(token) ? readClaims(token) : null;

  // Logout qua wrapper refresh-client (SF-4): revoke rt server-side + clear CẢ 2 key
  // (tokenStorage + bp.rt) — logout() không ném khi mạng chết nên await an toàn.
  async function logout() {
    await auth.logout();
    navigate('/login');
  }

  return (
    <header className="flex min-h-[52px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-s1 px-4 py-2 max-md:px-3">
      <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
          <svg viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 4.5h7M3 8h10M3 11.5h5" />
          </svg>
        </span>
        Boilerplate
      </span>
      <span aria-hidden="true" className="h-[18px] w-px shrink-0 self-center bg-line max-md:hidden" />
      <nav aria-label="Điều hướng chính" className="flex flex-wrap gap-0.5">
        <NavLink className={NAV_LINK} end to="/">
          Trang chủ
        </NavLink>
        <NavLink className={NAV_LINK} to="/tasks">
          Tasks
        </NavLink>
        <NavLink className={NAV_LINK} to="/activity">
          Activity
        </NavLink>
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {claims ? (
          <>
            <span
              className="flex h-7 max-w-[260px] items-center gap-2 rounded-2 border border-line bg-s2 py-0 pl-1 pr-2.5 max-md:max-w-[180px]"
              data-testid="nav-user"
            >
              {/* token hiếm khi thiếu email (readClaims chỉ validate sub) — guard tránh trắng nav */}
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center rounded-pill bg-accent/15 text-meta font-semibold text-accent"
              >
                {claims.email?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-meta text-ink2">
                {claims.email}
              </span>
            </span>
            <Button type="text" onClick={logout}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <Link
            className="inline-flex h-8 cursor-pointer items-center rounded-2 border-transparent bg-transparent px-[15px] text-body text-ink3 transition-colors hover:bg-s3 hover:text-ink2"
            to="/login"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
