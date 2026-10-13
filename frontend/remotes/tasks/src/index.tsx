// Standalone entry — CHỈ để debug remote đứng mình (:4001). Khi load trong shell, entry này
// KHÔNG chạy (shell import expose './TasksPage' trực tiếp qua Module Federation).
// SF-1 (story VU-53): import tokens+base để standalone không còn "trơ trụi". Trong shell,
// shell import global base LÀM CHỦ — remote không import lại (kiến trúc hand-off §2).
// SF-3 sẽ TIẾP TỤC sửa file này (banner debug) — GIỮ 2 import CSS dưới.
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
    <p>
      <small>Standalone debug mode — remote chạy thật trong shell (:3000). Token không có ở
        origin này nên API sẽ báo 401 — đúng hành vi (gateway/service chặn thiếu-token).</small>
    </p>
    <TasksPage />
  </StrictMode>,
);
