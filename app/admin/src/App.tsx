// App — routing admin. ThemeProvider (UiKitProvider dark/light) bọc toàn app —
// theme 1 click ở bất kỳ đâu (Header/Sidebar/Settings) đổi cả subtree. AppRoutes
// tách riêng để test render với MemoryRouter.
import { BrowserRouter, Route, Routes } from 'react-router';
import { AdminLayout } from './layout/AdminLayout.js';
import { ThemeProvider } from './theme.js';
import { Dashboard } from './pages/Dashboard.js';
import { Users } from './pages/Users.js';
import { UploadPage } from './pages/UploadPage.js';
import { HooksDemo } from './pages/HooksDemo.js';
import { ComponentsDemo } from './pages/ComponentsDemo.js';
import { Settings } from './pages/Settings.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/demo/hooks" element={<HooksDemo />} />
        <Route path="/demo/components" element={<ComponentsDemo />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
