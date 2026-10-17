import { Navigate, useLocation } from 'react-router';
import type { ReactElement } from 'react';
import { isExpired, tokenStorage } from '@wakii/fe-shared';

/** Gate route: chưa login (hoặc token hết hạn) → redirect /login, giữ lại path gốc. */
export function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  const token = tokenStorage.getToken();
  if (!token || isExpired(token)) {
    // giữ cả search + pathname — login xong quay lại đúng deep-link
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return children;
}
