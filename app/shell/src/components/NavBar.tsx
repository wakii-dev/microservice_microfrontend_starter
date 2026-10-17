import { Link, NavLink, useNavigate } from 'react-router';
import { isExpired, readClaims, tokenStorage } from '@wakii/fe-shared';
import { Button } from '@wakii/ui-kit';

/**
 * App chrome (hand-off §4): brand + nav + user chip/logout.
 * Active state: NavLink tự set aria-current="page" — visual = gạch --accent 2px dưới
 * (styles.css, selector [aria-current='page']). Đọc token MỖI render (không useState
 * cache) — login/logout navigate là re-render trigger, nav cập nhật email ngay.
 */
export function NavBar() {
  const navigate = useNavigate();
  const token = tokenStorage.getToken();
  const claims = token && !isExpired(token) ? readClaims(token) : null;

  function logout() {
    tokenStorage.clearToken();
    navigate('/login');
  }

  return (
    <header className="sh-topbar">
      <span className="sh-brand">
        <span aria-hidden="true" className="sh-brand__mark">
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
        Boilerplate
      </span>
      <span aria-hidden="true" className="sh-topbar__sep" />
      <nav aria-label="Điều hướng chính" className="sh-nav">
        <NavLink className="sh-nav__link" end to="/">
          Trang chủ
        </NavLink>
        <NavLink className="sh-nav__link" to="/tasks">
          Tasks
        </NavLink>
        <NavLink className="sh-nav__link" to="/activity">
          Activity
        </NavLink>
      </nav>
      <div className="sh-topbar__right">
        {claims ? (
          <>
            <span className="sh-user" data-testid="nav-user">
              {/* token hiếm khi thiếu email (readClaims chỉ validate sub) — guard tránh trắng nav */}
              <span aria-hidden="true" className="sh-user__avatar">
                {claims.email?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
              <span className="sh-user__email">{claims.email}</span>
            </span>
            <Button type="text" onClick={logout}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <Link className="inline-flex h-8 cursor-pointer items-center rounded-2 border-transparent bg-transparent px-[15px] text-body text-ink3 transition-colors hover:bg-s3 hover:text-ink2" to="/login">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
