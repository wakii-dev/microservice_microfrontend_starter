// Standalone render (tách khỏi index.tsx để entry là async boundary — RUNTIME-006).
// SF-1 (story VU-53): import tokens+base để standalone không còn "trơ trụi" — GIỮ imports.
// Trong shell, shell import global base LÀM CHỦ — remote không import lại (hand-off §2).
// SF-4: banner debug scoped (styles.css qua ActivityPage import) thay banner text trần.
import '@wakii/ui-kit/styles/tokens.css';
import '@wakii/ui-kit/styles/base.css';
import './app.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ActivityPage } from './ActivityPage';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root không tồn tại trong index.html');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

createRoot(container).render(
  // standalone không có host provider — tự wrap (in-shell thì shell cấp, singleton share)
  <StrictMode>
    <aside role="note" className="m-4 max-w-[720px] rounded-2 border border-line border-l-2 border-l-accent bg-s2 p-3 px-4 text-label text-ink2">
      <strong>Standalone debug mode</strong> — remote chạy thật trong shell (:3000). Token không có
      ở origin này nên API sẽ báo 401 — đúng hành vi (gateway/service chặn thiếu-token).
    </aside>
    <QueryClientProvider client={queryClient}>
      <ActivityPage />
    </QueryClientProvider>
  </StrictMode>,
);
