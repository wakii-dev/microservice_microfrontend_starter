// Standalone render (tách khỏi index.tsx để entry là async boundary — RUNTIME-006).
// SF-1 (story VU-53): import tokens+base để standalone không còn "trơ trụi". Trong shell,
// shell import global base LÀM CHỦ — remote không import lại (kiến trúc hand-off §2).
import 'wakii-ui-kit/styles/tokens.css';
import 'wakii-ui-kit/styles/base.css';
import './app.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TasksPage } from './TasksPage';

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
    <aside className="m-4 max-w-[720px] rounded-2 border border-line border-l-[3px] border-l-accent bg-s2 p-3 px-4 text-label text-ink2">
      <strong className="font-mono text-ink">Standalone debug — remote `tasks`</strong>
      <p className="mt-1">
        UI thật chạy trong shell (compose :8080, dev :3000). Origin này không có token JWT
        nên API trả 401 — đúng hành vi (gateway/service chặn thiếu-token).
      </p>
    </aside>
    <QueryClientProvider client={queryClient}>
      <TasksPage />
    </QueryClientProvider>
  </StrictMode>,
);
