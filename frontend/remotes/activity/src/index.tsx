// Standalone entry — CHỈ để debug remote đứng mình (:4002). Khi load trong shell, entry này
// KHÔNG chạy (shell import expose './ActivityPage' trực tiếp qua Module Federation).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ActivityPage } from './ActivityPage';

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
    <ActivityPage />
  </StrictMode>,
);
