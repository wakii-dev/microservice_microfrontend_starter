import { afterEach, describe, expect, it, vi } from 'vitest';
import { timeoutFetch } from '../src/api';

// Meta-test cho P1 review: login call PHẢI có timeout (AbortController) —
// không có thì nút "Đang đăng nhập…" treo vô hạn khi gateway chết.

afterEach(() => {
  vi.useRealTimers();
});

describe('timeoutFetch', () => {
  it('đính signal vào fetch call', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const f = timeoutFetch(1000, fetchMock);
    await f('http://x/api/auth/login', { method: 'POST' });
    const init = fetchMock.mock.calls[0][1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('hết hạn 15s → abort signal (fake timers)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted')),
          );
        }),
    );
    const f = timeoutFetch(15_000, fetchMock as unknown as typeof fetch);
    const p = f('http://x/api/auth/login', { method: 'POST' });
    vi.advanceTimersByTime(15_000);
    await expect(p).rejects.toThrow('aborted');
  });

  it('caller có signal sẵn → không override', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const f = timeoutFetch(1000, fetchMock);
    const mySignal = AbortSignal.abort();
    await f('http://x/', { signal: mySignal });
    expect(fetchMock.mock.calls[0][1].signal).toBe(mySignal);
  });
});
