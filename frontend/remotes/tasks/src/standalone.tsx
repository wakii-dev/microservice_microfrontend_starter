// Standalone render (tách khỏi index.tsx để entry là async boundary — RUNTIME-006).
// SF-1 (story VU-53): import tokens+base để standalone không còn "trơ trụi". Trong shell,
// shell import global base LÀM CHỦ — remote không import lại (kiến trúc hand-off §2).
import '@boilerplate/fe-shared/styles/tokens.css';
import '@boilerplate/fe-shared/styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TasksPage } from './TasksPage';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root không tồn tại trong index.html');
}

createRoot(container).render(
  <StrictMode>
    <aside className="tsk-standalone">
      <strong>Standalone debug — remote `tasks`</strong>
      <p>
        UI thật chạy trong shell (compose :8080, dev :3000). Origin này không có token JWT
        nên API trả 401 — đúng hành vi (gateway/service chặn thiếu-token).
      </p>
    </aside>
    <TasksPage />
  </StrictMode>,
);
