// browser worker — bắt fetch ở mức service worker CHỈ trong dev. public/mockServiceWorker.js
// do `pnpm exec msw init public/` sinh (đã kèm trong template; nâng cấp msw thì
// chạy lại lệnh đó). Build production không import file này (main.tsx check DEV).
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
