// Standalone render (tách khỏi index.tsx để entry là async boundary — RUNTIME-006).
// SF-1 (story VU-53): import tokens+base để standalone không còn "trơ trụi" — GIỮ imports.
// Trong shell, shell import global base LÀM CHỦ — remote không import lại (hand-off §2).
// SF-4: banner debug scoped (styles.css qua ActivityPage import) thay banner text trần.
import '@boilerplate/fe-shared/styles/tokens.css';
import '@boilerplate/fe-shared/styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ActivityPage } from './ActivityPage';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root không tồn tại trong index.html');
}

createRoot(container).render(
  <StrictMode>
    <aside className="act-standalone-banner" role="note">
      <strong>Standalone debug mode</strong> — remote chạy thật trong shell (:3000). Token không có
      ở origin này nên API sẽ báo 401 — đúng hành vi (gateway/service chặn thiếu-token).
    </aside>
    <ActivityPage />
  </StrictMode>,
);
