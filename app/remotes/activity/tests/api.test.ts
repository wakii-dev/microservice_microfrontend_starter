// API shape tests — assert URL/method/header khớp contract activity.yaml + envelope decode.
import { fetchFeed, fetchStats } from '../src/api';
import { tokenStorage } from '@wakii/fe-shared';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api — remote activity', () => {
  afterEach(() => {
    tokenStorage.clearToken();
    vi.unstubAllGlobals();
  });

  it('fetchFeed — GET /api/activity/feed với Authorization Bearer', async () => {
    tokenStorage.setToken('hdr.payload.sig');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchFeed();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/activity/feed?limit=20');
    expect(init.method).toBe('GET');
    expect(init.headers['Authorization']).toBe('Bearer hdr.payload.sig');
  });

  it('fetchStats — GET /api/activity/stats', async () => {
    tokenStorage.setToken('hdr.payload.sig');
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ totalTasks: 0, tasksByStatus: { todo: 0, in_progress: 0, done: 0 } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchStats();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/activity/stats');
    expect(init.method).toBe('GET');
    expect(init.headers['Authorization']).toBe('Bearer hdr.payload.sig');
  });

  it('error envelope 401 → ApiError giữ code (service tự verify JWT)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: 'UNAUTHORIZED', message: 'Token hết hạn', requestId: 'r2', details: null } },
        401,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const err = await fetchFeed().catch((e) => e);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Token hết hạn');
  });
});
