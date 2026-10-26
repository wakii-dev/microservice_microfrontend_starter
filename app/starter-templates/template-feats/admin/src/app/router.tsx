// router (bản ADMIN — đè src/app/router.tsx khi chọn preset admin): Route CHA
// bọc AdminLayout (Sidebar + Menu + Header) cho các trang trong app; /login
// đứng NGOÀI layout (trang login thường bare). Thêm trang: lazy import +
// <Route> trong nhóm layout.
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Skeleton } from '@wakii/ui-kit';

const AdminLayout = lazy(() => import('@/routes/admin-layout'));
const HomePage = lazy(() => import('@/routes/home'));
const TasksPage = lazy(() => import('@/routes/tasks'));
const LoginPage = lazy(() => import('@/routes/login'));
const NotFoundPage = lazy(() => import('@/routes/not-found'));

/* Fallback khi chunk route đang load — skeleton khung trang, không nhảy layout. */
function RouteFallback() {
  return (
    <div aria-busy="true">
      <Skeleton variant="text" className="mb-6 h-8 w-64" />
      <Skeleton variant="card" className="mb-6 h-40" />
      <Skeleton variant="row" count={3} />
    </div>
  );
}

export function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route element={<HomePage />} path="/" />
          <Route element={<TasksPage />} path="/tasks" />
        </Route>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </Suspense>
  );
}
