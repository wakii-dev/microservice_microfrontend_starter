// protected-route — guard route cần đăng nhập (mẫu, thay auth thật của bạn).
// Cách dùng: bọc element trong router.tsx:
//   <Route path="/private" element={
//     <ProtectedRoute isAuthenticated={!!token}>
//       <PrivatePage />
//     </ProtectedRoute>
//   } />
// Chưa thoả điều kiện → redirect về `fallback` (mặc định '/') kèm state để
// trang login quay lại đúng chỗ sau khi đăng nhập.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

export function ProtectedRoute({
  isAuthenticated,
  children,
  fallback = '/',
}: {
  /** Thay bằng check thật: có token/JWT hợp lệ, user loaded… */
  isAuthenticated: boolean;
  children: ReactNode;
  /** Đường dẫn redirect khi chưa thoả — thường là trang login. */
  fallback?: string;
}) {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate replace to={fallback} state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
