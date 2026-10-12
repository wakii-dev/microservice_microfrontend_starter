// API client dùng chung shell — base đọc từ build-time env (conventions/05 rule 3 + 07 CORS):
//   dev native: http://localhost:8090 (auth-mock trực tiếp, CORS dev mở)
//   prod qua gateway: '' (same-origin)
import { ApiClient, tokenStorage } from '@boilerplate/fe-shared';

const LOGIN_TIMEOUT_MS = 15_000;

/** Wrap fetch với AbortController timeout — fe-shared ApiClient (READ-ONLY) không có
 * AbortSignal sẵn; không timeout = nút "Đang đăng nhập…" treo vô hạn khi gateway chết. */
export function timeoutFetch(
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch.bind(globalThis),
): typeof fetch {
  return (input, init = {}) => {
    if (init.signal) {
      // caller tự quản signal — không override
      return fetchImpl(input, init);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`timeout ${timeoutMs}ms`)), timeoutMs);
    return fetchImpl(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
}

export const api = new ApiClient({
  baseUrl: __API_BASE_URL__,
  tokenStorage,
  fetchImpl: timeoutFetch(LOGIN_TIMEOUT_MS),
});
