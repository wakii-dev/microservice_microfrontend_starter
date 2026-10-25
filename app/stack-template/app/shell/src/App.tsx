import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// QueryClient của HOST — react-query MF singleton nên remotes (in-shell) dùng chung
// cache này: create task (remote tasks) → invalidate feed (remote activity) cùng nguồn.
// retry: false — demo fail hiển thị tức thì; refetchOnWindowFocus off cho demo ổn định.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
