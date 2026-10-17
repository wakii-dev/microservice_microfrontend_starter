// Refresh-client wrapper — auth flows v2 của epic auth-real (SF-4, VU-63).
// Hiệp ước: contracts/openapi/auth.yaml v2 + contracts/auth/token-contract.md v2 §2/§4 —
// response shape {user, accessToken, refreshToken} (DROP tokenType/expiresIn).
// File MỚI theo decision #5 (spec rev2): token-storage.ts READ-LOCKED không đụng —
// access token vẫn đi qua tokenStorage API có sẵn; refresh token lưu
// localStorage['bp.rt'] (key pin trong token-contract §2 — ĐỪNG đổi).
// 401 → refresh single-flight (promise lock, đúng 1 lần cho mọi caller đồng thời —
// giảm xác suất CAS-reuse strict 2 tab) → retry; refresh fail → clear cả 2 key +
// ném lỗi 401 (session chết, UI thấy Unauthorized thay vì 401 im lặng).
import { ApiClient, ApiError } from './api-client.js';
import { tokenStorage } from './token-storage.js';

/** Key localStorage cho refresh token — pin token-contract.md §2. */
export const REFRESH_STORAGE_KEY = 'bp.rt';

/** Mirror UserRef schema (auth.yaml v2). */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

/** Response chung login + register (AuthSession schema v2). */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/** Response /refresh (TokenPair schema — không có user). */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthClient {
  login(email: string, password: string): Promise<AuthSession>;
  register(email: string, password: string, displayName: string): Promise<AuthSession>;
  /** Chạy fn với access token hiện tại; 401 → refresh đúng 1 lần → retry với token mới. */
  withRefresh<T>(fn: (token: string) => Promise<T>): Promise<T>;
  /** Revoke refresh token server-side (idempotent) + clear cả 2 key — không ném khi mạng chết. */
  logout(): Promise<void>;
}

// localStorage có thể văng (SSR/storage bị chặn) — mirror fallback im lặng của
// token-storage.ts (READ-LOCKED, không export helper riêng được).

function readRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRefreshToken(token: string): void {
  try {
    window.localStorage.setItem(REFRESH_STORAGE_KEY, token);
  } catch {
    // storage chặn — access vẫn dùng được đến khi hết hạn 30m, refresh sẽ 401 sau
  }
}

function clearRefreshToken(): void {
  try {
    window.localStorage.removeItem(REFRESH_STORAGE_KEY);
  } catch {
    // không có gì để clear
  }
}

function unauthorizedError(): ApiError {
  return new ApiError(401, {
    error: { code: 'UNAUTHORIZED', message: 'Phiên đăng nhập đã hết hạn.', requestId: null, details: null },
  });
}

function isUnauthorized(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status === 401;
}

/** Tạo AuthClient gắn với một ApiClient (base URL + timeout fetch do caller cấu hình —
 * shell inject instance của src/api.ts). Mỗi bundle tự tạo 1 instance, lock trong phạm vi đó. */
export function createAuthClient(api: ApiClient): AuthClient {
  // Single-flight promise lock: mọi 401 đồng thời share 1 promise /refresh —
  // không đốt 2 refresh token (rotation CAS strict sẽ coi call sau là reuse, token-contract §3).
  let refreshInFlight: Promise<TokenPair> | null = null;

  function storeSession(session: { accessToken: string; refreshToken: string }): void {
    tokenStorage.setToken(session.accessToken);
    writeRefreshToken(session.refreshToken);
  }

  function clearSession(): void {
    tokenStorage.clearToken();
    clearRefreshToken();
  }

  function refreshOnce(): Promise<TokenPair> {
    refreshInFlight ??= (async () => {
      const rt = readRefreshToken();
      if (!rt) {
        throw unauthorizedError();
      }
      return api.post<TokenPair>('/api/auth/refresh', { refreshToken: rt });
    })().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  return {
    async login(email, password) {
      const session = await api.post<AuthSession>('/api/auth/login', { email, password });
      storeSession(session);
      return session;
    },

    async register(email, password, displayName) {
      const session = await api.post<AuthSession>('/api/auth/register', { email, password, displayName });
      storeSession(session);
      return session;
    },

    async withRefresh(fn) {
      try {
        return await fn(tokenStorage.getToken() ?? '');
      } catch (err) {
        if (!isUnauthorized(err)) {
          throw err; // lỗi nghiệp vụ (409…) hay mạng — không phải việc của refresh
        }
      }

      let pair: TokenPair;
      try {
        pair = await refreshOnce();
      } catch (refreshErr) {
        // refresh chết (401 reuse/hết hạn 7d, hết rt, mạng) — session không cứu được
        clearSession();
        throw refreshErr;
      }
      storeSession(pair);

      try {
        return await fn(pair.accessToken);
      } catch (retryErr) {
        // token mới mà vẫn 401 → session chết thật (user bị revoke…); lỗi khác giữ nguyên session
        if (isUnauthorized(retryErr)) {
          clearSession();
        }
        throw retryErr;
      }
    },

    async logout() {
      const rt = readRefreshToken();
      try {
        // 204 idempotent (token-contract §4); rt thiếu → không có gì revoke server-side
        if (rt) {
          await api.post<void>('/api/auth/logout', { refreshToken: rt });
        }
      } catch {
        // mạng/endpoint chết — intent đăng xuất thắng: vẫn clear cục bộ, không ném
      } finally {
        clearSession();
      }
    },
  };
}
