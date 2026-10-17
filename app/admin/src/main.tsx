// Entry — app admin (batch ⑦). CSS: tokens (kèm dark theme @import ở đầu) + base
// (reset) + tailwind utilities. Chỉ shell-host pattern: 1 lần ở root.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@wakii/ui-kit/styles/tokens.css';
import '@wakii/ui-kit/styles/base.css';
import './styles.css';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
