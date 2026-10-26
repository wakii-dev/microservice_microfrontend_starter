// Entry — thứ tự mount: MSW worker (CHỈ dev) start TRƯỚC render để mọi fetch
// của app đi qua mock → styles.css 1 lần → Providers → BrowserRouter → Router.
// Build production bỏ qua mock, gọi backend thật qua VITE_API_URL.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './styles.css';
import { Providers } from '@/app/providers';
import { Router } from '@/app/router';

async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </Providers>
    </StrictMode>,
  );
});
