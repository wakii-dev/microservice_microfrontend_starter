// Entry — styles.css (tokens + dark + base + tailwind utilities của kit) import
// 1 lần ở root TRƯỚC khi render — copy pattern app/admin main.tsx. Landing là
// 1 trang duy nhất: KHÔNG router, KHÔNG data layer — App render thẳng.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
