// API client dùng chung shell — base đọc từ build-time env (conventions/05 rule 3 + 07 CORS):
//   dev native: http://localhost:8090 (auth svc trực tiếp, CORS dev mở)
//   prod qua gateway: '' (same-origin)
import { ApiClient, createAuthClient, tokenStorage } from '@wakii/fe-shared';

const LOGIN_TIMEOUT_MS = 15_000;

/** Wrap fetch với AbortController timeout — fe-shared ApiClient (READ-ONLY) không có
 * AbortSignal sẵn; không timeout = nút "Đang đăng nhập…" treo vô hạn khi gateway chết.
 * fetchImpl bind LAZY tại call-time (mirror tasks/src/api.ts): vi.stubGlobal('fetch')
 * trong unit test có hiệu lực; prod hành vi như cũ. */
export function timeoutFetch(
  timeoutMs: number,
  fetchImpl?: typeof fetch,
): typeof fetch {
  return (input, init = {}) => {
    const doFetch = fetchImpl ?? fetch.bind(globalThis);
    if (init.signal) {
      // caller tự quản signal — không override
      return doFetch(input, init);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`timeout ${timeoutMs}ms`)), timeoutMs);
    return doFetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
}

export const api = new ApiClient({
  baseUrl: __API_BASE_URL__,
  tokenStorage,
  fetchImpl: timeoutFetch(LOGIN_TIMEOUT_MS),
});

/** Auth flows qua wrapper refresh-client (SF-4): login/register/withRefresh/logout —
 * access → tokenStorage, refresh → localStorage['bp.rt'] (token-contract.md §2). */
export const auth = createAuthClient(api);
