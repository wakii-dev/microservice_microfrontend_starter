// api client — fetch wrapper DUY NHẤT của app: mọi call backend đi qua đây để
// đồng bộ baseURL (env), timeout (8s) và error envelope { message }. Tầng này
// THUẦN TS — cấm import react (eslint chặn), trả data thô cho feature parse zod.
import { env } from '@/env';

const TIMEOUT_MS = 8_000;

/** Lỗi API chuẩn — UI bắt theo `status` (0 = mạng/timeout) thay vì message. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Body JSON — object thường, tự stringify ở đây. */
  body?: unknown;
  /** Query params — nối sau path (?empty=1…). Object rỗng/undefined → không query. */
  query?: Record<string, string>;
}

/** Envelope lỗi backend { message } — convention chung (platform/conventions/04). */
interface ErrorEnvelope {
  message?: string;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;
  // Không có VITE_API_URL → relative trên origin hiện tại. Resolve tường minh
  // (thay vì fetch('/…')) vì fetch cần URL absolute ở môi trường test node/jsdom.
  const base = env.VITE_API_URL ?? window.location.origin;
  const search = query && Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : '';

  // Timeout bằng Promise.race (KHÔNG AbortSignal qua fetch): AbortSignal của
  // realm jsdom bị fetch gốc (undici) từ chối trong test — race chạy đúng ở cả
  // browser lẫn node.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ApiError(`Máy chủ không phản hồi sau ${TIMEOUT_MS / 1000}s.`, 0)),
      TIMEOUT_MS,
    );
  });

  let response: Response;
  try {
    response = await Promise.race([
      fetch(`${base}${path}${search}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      timeout,
    ]);
  } catch (error) {
    if (error instanceof ApiError) throw error; // timeout
    throw new ApiError('Không kết nối được máy chủ (offline hoặc bị chặn).', 0);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const envelope = (await response.json().catch(() => null)) as ErrorEnvelope | null;
    throw new ApiError(envelope?.message ?? `Yêu cầu thất bại (HTTP ${response.status}).`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
