// Entry — app admin (batch ⑦). CSS: tokens + dark theme (import TƯỜNG MINH SAU tokens —
// dark block phải đứng sau :root để thắng specificity ngang; @import nội bộ tokens.css
// đứng TRƯỚC :root nên bị light override — bug toggle không ăn, fix 2026-10-18) + base
// (reset) + tailwind utilities. 1 lần ở root.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@wakii/ui-kit/styles/tokens.css';
import '@wakii/ui-kit/styles/themes/dark.css';
import '@wakii/ui-kit/styles/base.css';
import './styles.css';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
