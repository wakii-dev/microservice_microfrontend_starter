// Token storage — lưu JWT cho shell/remotes (token-contract.md: TTL 8h, không refresh).
// Mặc định localStorage (persist qua refresh); có thể inject storage khác (memory cho test).

const STORAGE_KEY = 'bp.jwt';

export interface TokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}

function defaultStorage(): Storage | null {
  try {
    // SSR/next lớn: localStorage có thể văng — trả null, rơi về memory
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

let memoryToken: string | null = null;

export const tokenStorage: TokenStorage = {
  getToken(): string | null {
    return defaultStorage()?.getItem(STORAGE_KEY) ?? memoryToken;
  },
  setToken(token: string): void {
    memoryToken = token;
    defaultStorage()?.setItem(STORAGE_KEY, token);
  },
  clearToken(): void {
    memoryToken = null;
    defaultStorage()?.removeItem(STORAGE_KEY);
  },
};

/**
 * Giải payload JWT (phần giữa) KHÔNG verify signature — chỉ đọc claims để hiển thị
 * (vd user email trên nav). Verify signature là việc service BE (enforcement 2 lớp,
 * token-contract.md §4). Token hết hạn phía FE: so exp < now → clear + redirect login.
 */
export function readClaims(token: string): { sub: string; email: string; roles: string[]; exp: number } | null {
  try {
    // base64url → base64: đổi alphabet + tự bổ sung padding (JWT segment không có '=')
    let seg = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    seg += '='.repeat(seg.length % 4 === 0 ? 0 : 4 - (seg.length % 4));
    const payload = JSON.parse(atob(seg));
    return payload.sub ? payload : null;
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const claims = readClaims(token);
  return !claims || claims.exp * 1000 < Date.now();
}
