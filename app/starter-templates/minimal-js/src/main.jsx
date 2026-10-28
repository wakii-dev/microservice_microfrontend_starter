// Entry — thứ tự mount: styles.css 1 lần (tokens + tailwind của kit) →
// Providers (ErrorBoundary + UiKitProvider) → BrowserRouter → Router.
// Chỉ wire, không có UI logic — UI nằm ở src/app/router.jsx + src/routes/.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './styles.css';
import { Providers } from '@/app/providers';
import { Router } from '@/app/router';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </Providers>
  </StrictMode>,
);
