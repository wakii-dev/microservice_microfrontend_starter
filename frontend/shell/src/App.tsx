import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RemotePage } from './pages/RemotePage';

/** Routes inner — tách riêng để test mount được với MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        {/* /tasks /activity — remote theo registry (conventions/08); T5 thay RemotePage bằng RemoteSlot */}
        <Route
          path="/tasks"
          element={
            <RequireAuth>
              <RemotePage title="Tasks" />
            </RequireAuth>
          }
        />
        <Route
          path="/activity"
          element={
            <RequireAuth>
              <RemotePage title="Activity" />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
