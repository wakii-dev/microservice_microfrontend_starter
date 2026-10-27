// Smoke tests bề mặt public @wakii/fe-shared (mission publish-fe-shared) — node-safe
// (không cần jsdom: tokenStorage tự rơi về memory khi không có window; ApiClient nhận
// fetchImpl mock). Mục đích: gate `pnpm --filter @wakii/fe-shared test` có nghĩa trước
// khi publish npm (trước đây package chưa có test nào).
import { describe, expect, it } from 'vitest';
import { ApiClient, ApiError } from './api-client.js';
import { decodeErrorEnvelope } from './error-envelope.js';
import { REMOTE_NAMES, resolveRemoteUrl } from './mf-bootstrap.js';
import { isExpired, readClaims, tokenStorage } from './token-storage.js';

/** JWT giả 3 segment (header.payload.signature) — payload base64url, KHÔNG ký (readClaims không verify). */
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url('{"alg":"HS256","typ":"JWT"}')}.${b64url(JSON.stringify(payload))}.sig`;
}

describe('token-storage', () => {
  it('tokenStorage set/get/clear — memory fallback khi không có window', () => {
    tokenStorage.setToken('jwt-abc');
    expect(tokenStorage.getToken()).toBe('jwt-abc');
    tokenStorage.clearToken();
    expect(tokenStorage.getToken()).toBeNull();
  });

  it('readClaims decode payload base64url; token rác → null', () => {
    const claims = readClaims(makeJwt({ sub: 'alice', email: 'alice@demo.local', roles: ['user'], exp: 9999999999 }));
    expect(claims?.sub).toBe('alice');
    expect(claims?.roles).toEqual(['user']);
    expect(readClaims('not-a-jwt')).toBeNull();
  });

  it('isExpired — exp tương lai false; exp quá khứ / không decode được → true', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isExpired(makeJwt({ sub: 'a', exp: now + 3600 }))).toBe(false);
    expect(isExpired(makeJwt({ sub: 'a', exp: now - 3600 }))).toBe(true);
    expect(isExpired('garbage')).toBe(true);
  });
});

describe('error-envelope', () => {
  it('decodeErrorEnvelope — envelope chuẩn → ApiError đủ status/code/requestId', () => {
    const err = decodeErrorEnvelope(404, {
      error: { code: 'TASK_NOT_FOUND', message: 'no task', requestId: 'r-1', details: null },
    });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.code).toBe('TASK_NOT_FOUND');
    expect(err.requestId).toBe('r-1');
    expect(err.message).toBe('no task');
  });

  it('decodeErrorEnvelope — body lạ → fallback envelope INTERNAL', () => {
    const fallback = decodeErrorEnvelope(500, 'boom');
    expect(fallback.code).toBe('INTERNAL');
    expect(fallback.message).toContain('500');
  });
});

describe('api-client', () => {
  it('ApiClient gắn Bearer token + decode envelope 4xx qua fetchImpl mock', async () => {
    tokenStorage.setToken('jwt-123');
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = new ApiClient({
      baseUrl: 'http://localhost:8080/', // trailing slash bị cắt
      tokenStorage,
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({ error: { code: 'TASK_NOT_FOUND', message: 'no task', requestId: 'r-9', details: null } }),
          { status: 404 },
        );
      },
    });

    await expect(client.get('/api/tasks')).rejects.toMatchObject({ status: 404, code: 'TASK_NOT_FOUND', requestId: 'r-9' });
    expect(calls[0].url).toBe('http://localhost:8080/api/tasks');
    expect((calls[0].init.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-123');
    tokenStorage.clearToken();
  });

  it('ApiClient 2xx JSON → trả body parse; 204 → undefined', async () => {
    const client = new ApiClient({
      baseUrl: '',
      tokenStorage,
      fetchImpl: async (_url, init) => {
        if ((init?.method ?? 'GET') === 'DELETE') return new Response(null, { status: 204 });
        return new Response(JSON.stringify([{ id: 't-1' }]), { status: 200 });
      },
    });
    await expect(client.get('/api/tasks')).resolves.toEqual([{ id: 't-1' }]);
    await expect(client.delete('/api/tasks/t-1')).resolves.toBeUndefined();
  });
});

describe('mf-bootstrap', () => {
  it('resolveRemoteUrl — mặc định qua gateway; __REMOTE_URLS__ inject → ưu tiên', () => {
    expect(resolveRemoteUrl('tasks')).toBe('/remotes/tasks/remoteEntry.js');
    (globalThis as Record<string, unknown>)['__REMOTE_URLS__'] = { tasks: 'http://localhost:4001/remoteEntry.js' };
    expect(resolveRemoteUrl('tasks')).toBe('http://localhost:4001/remoteEntry.js');
    delete (globalThis as Record<string, unknown>)['__REMOTE_URLS__'];
    expect(resolveRemoteUrl('tasks')).toBe('/remotes/tasks/remoteEntry.js');
  });

  it('REMOTE_NAMES khớp registry conventions/08', () => {
    expect(REMOTE_NAMES).toEqual(['tasks', 'activity']);
  });
});
