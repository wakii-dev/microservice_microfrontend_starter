import { Link, useNavigate } from 'react-router';
import { isExpired, readClaims, tokenStorage } from '@boilerplate/fe-shared';

/**
 * Nav tối giản: links + user email (decode từ JWT, KHÔNG verify — verify là việc BE) + logout.
 * Đọc token MỖI render (không useState cache) — login/logout navigate là re-render trigger,
 * nav cập nhật email ngay.
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
    <nav aria-label="Điều hướng chính">
      <Link to="/">Trang chủ</Link>
      <Link to="/tasks">Tasks</Link>
      <Link to="/activity">Activity</Link>
      {claims ? (
        <>
          <span data-testid="nav-user">{claims.email}</span>
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        </>
      ) : (
        <Link to="/login">Đăng nhập</Link>
      )}
    </nav>
  );
}
