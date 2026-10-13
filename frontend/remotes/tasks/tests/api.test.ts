// API shape tests — assert URL/method/header/body khớp contract tasks.yaml + envelope decode.
import { ApiError, createTask, fetchTasks, timeoutFetch, updateTask } from '../src/api';
import { tokenStorage } from '@boilerplate/fe-shared';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api — remote tasks', () => {
  afterEach(() => {
    tokenStorage.clearToken();
    vi.unstubAllGlobals();
  });

  it('fetchTasks — GET /api/tasks với Authorization Bearer', async () => {
    tokenStorage.setToken('hdr.payload.sig');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks?limit=50');
    expect(init.method).toBe('GET');
    expect(init.headers['Authorization']).toBe('Bearer hdr.payload.sig');
  });

  it('createTask — POST JSON body + Content-Type', async () => {
    tokenStorage.setToken('hdr.payload.sig');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 't1' }, 201));
    vi.stubGlobal('fetch', fetchMock);

    await createTask({ title: 'Viết báo cáo', description: 'mô tả' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ title: 'Viết báo cáo', description: 'mô tả' });
  });

  it('updateTask — PATCH /api/tasks/{id}', async () => {
    tokenStorage.setToken('hdr.payload.sig');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 't1', status: 'done' }));
    vi.stubGlobal('fetch', fetchMock);

    await updateTask('abc-123', { status: 'done' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks/abc-123');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ status: 'done' });
  });

  it('error envelope 400 → ApiError giữ code + requestId (conventions/04)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title không được rỗng',
            requestId: 'req-1',
            details: null,
          },
        },
        400,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const err = await createTask({ title: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Title không được rỗng');
    expect(err.requestId).toBe('req-1');
  });

  it('timeoutFetch — abort sau timeoutMs (không treo vô hạn khi service chết)', async () => {
    const hangingFetch = vi.fn(
      (_input: unknown, init?: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const f = timeoutFetch(20, hangingFetch as unknown as typeof fetch);
    await expect(f('http://localhost:3001/api/tasks', {})).rejects.toThrow();
    expect(hangingFetch).toHaveBeenCalledTimes(1);
  });
});
