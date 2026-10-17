import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { RemoteSlot } from './components/RemoteSlot';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

/** Routes inner — tách riêng để test mount được với MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        {/* Remote slots theo registry conventions/08: expose ./TasksPage, ./ActivityPage (SF-6 impl) */}
        <Route
          path="/tasks"
          element={
            <RequireAuth>
              <RemoteSlot name="tasks" exposedModule="./TasksPage" />
            </RequireAuth>
          }
        />
        <Route
          path="/activity"
          element={
            <RequireAuth>
              <RemoteSlot name="activity" exposedModule="./ActivityPage" />
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
