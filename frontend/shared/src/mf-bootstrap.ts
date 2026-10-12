// MF bootstrap helper — chuẩn hoá việc load remote cho shell (SF-5) và remotes (SF-6).
// Remote registry: platform/conventions/08-gateway-and-remotes.md — URL đọc từ env, KHÔNG hardcode.

/** Tên remote hợp lệ trong registry — đổi danh sách = sửa conventions/08 cùng commit. */
export const REMOTE_NAMES = ['tasks', 'activity'] as const;
export type RemoteName = (typeof REMOTE_NAMES)[number];

export interface RemoteEntry {
  /** Module federation container name (khoá trong rspack remotes config) */
  name: RemoteName;
  /** URL remoteEntry.js — dev: env REMOTE_TASKS_URL/REMOTE_ACTIVITY_URL; prod: /remotes/<name>/remoteEntry.js */
  url: string;
}

/** Đọc URL remote từ env (Vite/Rspack inject DEFINE tại build; runtime thì window.__REMOTE_URLS__). */
export function resolveRemoteUrl(name: RemoteName): string {
  const envKey = name === 'tasks' ? 'REMOTE_TASKS_URL' : 'REMOTE_ACTIVITY_URL';
  const fromWindow = (globalThis as Record<string, unknown>)['__REMOTE_URLS__'] as
    | Record<string, string>
    | undefined;
  if (fromWindow?.[name]) {
    return fromWindow[name];
  }
  // Fallback prod: đi qua gateway path (conventions/08 remote registry prod URL)
  return `/remotes/${name}/remoteEntry.js`;
  // NOTE: build-time env (`process.env[envKey]`) do host app (SF-5) inject — helper này
  // không import process để giữ side-effect-free cho cả browser bundle.
}

/**
 * Load 1 exposed module từ remote. Wrapper mỏng quanh import() federation —
 * bắt lỗi remote-down để shell render error boundary thay vì trắng trang (SF-5 task).
 */
export async function loadRemoteModule<T>(remote: RemoteEntry, exposedModule: string): Promise<T> {
  const containerKey = `${remote.name}/${exposedModule}`;
  try {
    return (await import(/* webpackIgnore: true */ containerKey)) as T;
  } catch (err) {
    throw new Error(
      `Remote "${remote.name}" load failed (${remote.url}). Remote có thể đang down — shell phải render fallback. Nguyên nhân gốc: ${String(err)}`,
    );
  }
}
