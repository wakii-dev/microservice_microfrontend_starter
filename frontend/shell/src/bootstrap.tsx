import { createRoot } from 'react-dom/client';
import { App } from './App';
// Shell LÀM CHỦ global (kiến trúc SF-1, base.css header): tokens + base import ở entry
// — styles.css (scoped sh-*, unlayered) import SAU để thắng base khi cùng specificity.
import '@boilerplate/fe-shared/styles/tokens.css';
import '@boilerplate/fe-shared/styles/base.css';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root không tồn tại trong index.html');
}

createRoot(container).render(<App />);
