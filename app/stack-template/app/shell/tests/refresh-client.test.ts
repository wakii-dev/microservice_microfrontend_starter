import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiClient,
  ApiError,
  REFRESH_STORAGE_KEY,
  createAuthClient,
  tokenStorage,
  type AuthSession,
} from '@wakii/fe-shared';

// SF-4 (VU-63) — wrapper refresh-client (file MỚI, token-storage READ-LOCKED nguyên vẹn).
// Contract: auth.yaml v2 + token-contract.md v2 — response {user, accessToken, refreshToken},
// refresh lưu localStorage['bp.rt'], 401 → refresh single-flight đúng 1 lần → retry.

const ENVELOPE_401 = {
  error: { code: 'UNAUTHORIZED', message: 'unauthorized', requestId: null, details: null },
};
const ENVELOPE_409 = {
  error: { code: 'CONFLICT', message: 'email exists', requestId: null, details: null },
};

const PATH = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
};

/** JWT fake đủ 3 segment (readClaims decode được) — test-only, không qua BE. */
function jwt(sub = 'u1', email = 'alice@demo.local'): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ sub, email, roles: ['admin'], exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

function session(over: Partial<AuthSession> = {}): AuthSession {
  return {
    user: { id: 'u1', email: 'alice@demo.local', displayName: 'Alice', roles: ['admin'] },
    accessToken: jwt(),
    refreshToken: 'rt-1',
    ...over,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function makeClient() {
  const fetchMock = vi.fn();
  const api = new ApiClient({ baseUrl: '', tokenStorage, fetchImpl: fetchMock as unknown as typeof fetch });
  return { client: createAuthClient(api), fetchMock };
}

function unauthorized(): ApiError {
  return new ApiError(401, ENVELOPE_401);
}

beforeEach(() => {
  window.localStorage.clear();
  tokenStorage.clearToken();
});

describe('auth.login/register — lưu cặp token (shape v2)', () => {
  it('login → POST /api/auth/login + lưu access → bp.jwt, refresh → bp.rt', async () => {
    const { client, fetchMock } = makeClient();
    const s = session({ refreshToken: 'rt-login' });
    fetchMock.mockResolvedValue(jsonResponse(200, s));

    const out = await client.login('alice@demo.local', 'demo-password');

    expect(out).toEqual(s);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(PATH.login);
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'alice@demo.local', password: 'demo-password' });
    expect(tokenStorage.getToken()).toBe(s.accessToken);
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBe('rt-login');
  });

  it('register → POST /api/auth/register {email,password,displayName} + lưu cặp', async () => {
    const { client, fetchMock } = makeClient();
    const s = session({
      user: { id: 'u2', email: 'new@demo.local', displayName: 'New User', roles: ['user'] },
      accessToken: jwt('u2', 'new@demo.local'),
      refreshToken: 'rt-reg',
    });
    fetchMock.mockResolvedValue(jsonResponse(201, s));

    const out = await client.register('new@demo.local', 'sup-secret-1', 'New User');

    expect(out).toEqual(s);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(PATH.register);
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'new@demo.local',
      password: 'sup-secret-1',
      displayName: 'New User',
    });
    expect(tokenStorage.getToken()).toBe(s.accessToken);
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBe('rt-reg');
  });
});

describe('withRefresh — 401 → refresh single-flight → retry', () => {
  it('fn 401 → refresh ĐÚNG 1 LẦN với rt đã lưu → retry với token MỚI → kết quả trả về', async () => {
    tokenStorage.setToken('old-access');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    fetchMock.mockResolvedValue(jsonResponse(200, { accessToken: 'new-access', refreshToken: 'rt-2' }));

    const tokens: string[] = [];
    const fn = vi.fn(async (token: string) => {
      tokens.push(token);
      if (tokens.length === 1) throw unauthorized();
      return 'result';
    });

    const result = await client.withRefresh(fn);

    expect(result).toBe('result');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(PATH.refresh);
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'rt-1' });
    // retry nhận ĐÚNG token mới, không phải token cũ
    expect(tokens).toEqual(['old-access', 'new-access']);
    // cặp mới được lưu lại cả 2 key
    expect(tokenStorage.getToken()).toBe('new-access');
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBe('rt-2');
  });

  it('refresh cũng 401 → clear CẢ 2 key + ném ApiError UNAUTHORIZED, không retry', async () => {
    tokenStorage.setToken('old-access');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    fetchMock.mockResolvedValue(jsonResponse(401, ENVELOPE_401));
    const fn = vi.fn(async () => {
      throw unauthorized();
    });

    await expect(client.withRefresh(fn)).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });

    expect(fetchMock).toHaveBeenCalledTimes(1); // refresh đúng 1 lần, không lặp
    expect(fn).toHaveBeenCalledTimes(1); // refresh chết → không retry
    expect(tokenStorage.getToken()).toBeNull();
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
  });

  it('401 nhưng KHÔNG có refresh token → clear access + 401, không gọi /refresh', async () => {
    tokenStorage.setToken('old-access');
    const { client, fetchMock } = makeClient();
    const fn = async () => {
      throw unauthorized();
    };

    await expect(client.withRefresh(fn)).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(tokenStorage.getToken()).toBeNull();
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
  });

  it('2 withRefresh 401 đồng thời → /refresh chỉ gọi 1 LẦN, cả 2 retry đều dùng token mới', async () => {
    tokenStorage.setToken('old-access');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    // refresh chậm 1 tick — cả 2 caller 401 kịp share cùng promise lock
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(jsonResponse(200, { accessToken: 'new-access', refreshToken: 'rt-2' })), 0),
        ),
    );
    const makeFn = () => {
      let first = true;
      return async (token: string) => {
        if (first) {
          first = false;
          throw unauthorized();
        }
        return `ok:${token}`;
      };
    };

    const [a, b] = await Promise.all([client.withRefresh(makeFn()), client.withRefresh(makeFn())]);

    expect(a).toBe('ok:new-access');
    expect(b).toBe('ok:new-access');
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url) === PATH.refresh);
    expect(refreshCalls).toHaveLength(1);
    // single-flight xong lock nhả — 401 SAU đó vẫn refresh được (không khoá vĩnh viễn)
    tokenStorage.setToken('old-access');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-2');
    fetchMock.mockResolvedValue(jsonResponse(200, { accessToken: 'again', refreshToken: 'rt-3' }));
    const fnLater = vi.fn(async (token: string) => {
      if (token === 'old-access') throw unauthorized();
      return 'later';
    });
    await expect(client.withRefresh(fnLater)).resolves.toBe('later');
    expect(fetchMock.mock.calls.filter(([url]) => String(url) === PATH.refresh)).toHaveLength(2);
  });

  it('retry với token mới VẪN 401 → clear 2 key + ném 401, không refresh lần 2', async () => {
    tokenStorage.setToken('old-access');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    fetchMock.mockResolvedValue(jsonResponse(200, { accessToken: 'new-access', refreshToken: 'rt-2' }));
    const fn = vi.fn(async () => {
      throw unauthorized();
    });

    await expect(client.withRefresh(fn)).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(tokenStorage.getToken()).toBeNull();
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
  });

  it('fn lỗi KHÔNG phải 401 (409) → ném thẳng, không refresh, giữ nguyên session', async () => {
    tokenStorage.setToken('old-access');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    const fn = async () => {
      throw new ApiError(409, ENVELOPE_409);
    };

    await expect(client.withRefresh(fn)).rejects.toMatchObject({ status: 409 });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(tokenStorage.getToken()).toBe('old-access');
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBe('rt-1');
  });

  it('retry thành công nhưng văng lỗi KHÔNG phải 401 → giữ nguyên session mới (chỉ 401 mới clear)', async () => {
    tokenStorage.setToken('old-access');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    fetchMock.mockResolvedValue(jsonResponse(200, { accessToken: 'new-access', refreshToken: 'rt-2' }));
    const fn = vi.fn(async (token: string) => {
      if (token === 'old-access') throw unauthorized();
      // token mới hợp lệ nhưng request business văng 409 (vd trùng dữ liệu) — không phải hết phiên
      throw new ApiError(409, ENVELOPE_409);
    });

    await expect(client.withRefresh(fn)).rejects.toMatchObject({ status: 409 });

    // refresh vẫn diễn ra đúng 1 lần; lỗi retry non-401 KHÔNG được xoá session
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(tokenStorage.getToken()).toBe('new-access');
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBe('rt-2');
  });

  it('fn thành công ngay → không đụng refresh, kết quả truyền thẳng', async () => {
    tokenStorage.setToken('old-access');
    const { client, fetchMock } = makeClient();
    const out = await client.withRefresh(async () => 42);
    expect(out).toBe(42);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('logout — revoke + clear sạch', () => {
  it('logout → POST /api/auth/logout với rt đã lưu + clear CẢ 2 key', async () => {
    tokenStorage.setToken('access-1');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await client.logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(PATH.logout);
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'rt-1' });
    expect(tokenStorage.getToken()).toBeNull();
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
  });

  it('logout khi mạng chết → VẪN clear 2 key, không ném lỗi (intent đăng xuất thắng)', async () => {
    tokenStorage.setToken('access-1');
    window.localStorage.setItem(REFRESH_STORAGE_KEY, 'rt-1');
    const { client, fetchMock } = makeClient();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(client.logout()).resolves.toBeUndefined();

    expect(tokenStorage.getToken()).toBeNull();
    expect(window.localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
  });

  it('logout không có refresh token → không gọi mạng, vẫn clear', async () => {
    tokenStorage.setToken('access-1');
    const { client, fetchMock } = makeClient();

    await client.logout();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(tokenStorage.getToken()).toBeNull();
  });
});
