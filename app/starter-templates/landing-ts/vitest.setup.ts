// Setup dùng chung cho mọi test file — 2 việc:
// 1. Nạp matchers jest-dom (toBeInTheDocument, toHaveTextContent, …) vào expect.
// 2. Stub window.matchMedia — jsdom KHÔNG có sẵn, mà motion kit (Parallax qua
//    useMediaQuery đọc prefers-reduced-motion) gọi matchMedia lúc mount → thiếu
//    stub là test crash. Trả matches:false = apps chạy nhánh "motion bật".
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated API — vài thư viện cũ vẫn gọi
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
