// API shape tests — assert URL/method/header/body khớp contract tasks.yaml + envelope decode.
// SF-3 (VU-56): fetchTasks nhận params limit/offset/status (clamp limit 1..100, offset ≥ 0) + deleteTask.
// Search server-side: fetchTasks nhận thêm q (URLSearchParams encode; node-svc tự trim + escape LIKE).
import {
  ApiError,
  createTask,
  deleteTask,
  fetchTasks,
  timeoutFetch,
  updateTask,
} from '../src/api';
import { tokenStorage } from '@wakii/fe-shared';

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

  it('fetchTasks — GET /api/tasks mặc định limit=10&offset=0 + Authorization Bearer', async () => {
    tokenStorage.setToken('hdr.payload.sig');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks?limit=10&offset=0');
    expect(init.method).toBe('GET');
    expect(init.headers['Authorization']).toBe('Bearer hdr.payload.sig');
  });

  it('fetchTasks — params status/limit/offset lên query đúng thứ tự contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks({ status: 'in_progress', limit: 20, offset: 40 });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks?limit=20&offset=40&status=in_progress');
  });

  it('fetchTasks — clamp theo contract: limit max 100, offset ≥ 0', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks({ limit: 500, offset: -5 });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks?limit=100&offset=0');
  });

  it('fetchTasks — q lên query (search server-side, sau status theo contract)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks({ q: 'báo cáo' });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks?limit=10&offset=0&q=b%C3%A1o+c%C3%A1o');
  });

  it('fetchTasks — q rỗng KHÔNG gởi param (server tự trim — không gửi param thừa)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks({ q: '' });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks?limit=10&offset=0');
  });

  it('fetchTasks — q ký tự LIKE (`%` `_`) được encode an toàn trên URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTasks({ q: '100%_x' });

    const [url] = fetchMock.mock.calls[0];
    // URLSearchParams encode % → %25 (escape LIKE là việc node-svc)
    expect(url).toBe('/api/tasks?limit=10&offset=0&q=100%25_x');
  });

  it('deleteTask — DELETE /api/tasks/{id} + Authorization, 204 không body', async () => {
    tokenStorage.setToken('hdr.payload.sig');
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteTask('abc-123')).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tasks/abc-123');
    expect(init.method).toBe('DELETE');
    expect(init.headers['Authorization']).toBe('Bearer hdr.payload.sig');
    expect(init.body).toBeUndefined();
  });

  it('deleteTask — 404 error envelope → ApiError giữ code + requestId', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Không tìm thấy task',
            requestId: 'req-9',
            details: null,
          },
        },
        404,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const err = await deleteTask('missing').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.code).toBe('TASK_NOT_FOUND');
    expect(err.requestId).toBe('req-9');
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
