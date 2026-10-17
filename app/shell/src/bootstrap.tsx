import { createRoot } from 'react-dom/client';
import { App } from './App';
// F1 (review VU-53 follow-up): nạp URL remote build-time vào __REMOTE_URLS__ TRƯỚC khi
// mount — retry BUG-2 (registerRemotes force) re-register ĐÚng url webpack đã đăng ký,
// kể cả dev-native (REMOTE_TASKS_URL env ≠ fallback /remotes/*). Chi tiết: remote-urls.ts
import { registerBuildtimeRemoteUrls } from './remote-urls';
// Shell LÀM CHỦ global (kiến trúc SF-1, base.css header): tokens + base import ở entry
// — styles.css (scoped sh-*, unlayered) import SAU để thắng base khi cùng specificity.
import '@boilerplate/fe-shared/styles/tokens.css';
import '@boilerplate/fe-shared/styles/base.css';
import './styles.css';

registerBuildtimeRemoteUrls();

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root không tồn tại trong index.html');
}

createRoot(container).render(<App />);
