// API client wrapper — mọi call lên gateway :8080 (conventions/05: CỔNG DUY NHẤT).
// Trách nhiệm: đính JWT từ TokenStorage + decode error envelope (conventions/04).
import { decodeErrorEnvelope, ApiError } from './error-envelope.js';
import type { TokenStorage } from './token-storage.js';

export interface ApiClientOptions {
  baseUrl: string; // vd "http://localhost:8080" (dev native) hoặc "" (đồng origin qua gateway)
  tokenStorage: TokenStorage;
  fetchImpl?: typeof fetch;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenStorage: TokenStorage;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.tokenStorage = opts.tokenStorage;
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }
  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }
  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }
  async delete(path: string): Promise<void> {
    await this.request<void>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    const token = this.tokenStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      let raw: unknown = null;
      try {
        raw = await res.json();
      } catch {
        // body không phải JSON — giữ null, decodeErrorEnvelope fallback
      }
      throw decodeErrorEnvelope(res.status, raw);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return (await res.json()) as T;
  }
}

export { ApiError };
