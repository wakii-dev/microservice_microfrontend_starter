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

/** Đọc URL remote từ env — host app (SF-5) inject `__REMOTE_URLS__` lúc bootstrap
 * (build-time env REMOTE_TASKS_URL/REMOTE_ACTIVITY_URL); fallback prod đi qua gateway
 * (conventions/08 remote registry prod URL). Không import `process` — giữ side-effect-free. */
export function resolveRemoteUrl(name: RemoteName): string {
  const fromWindow = (globalThis as Record<string, unknown>)['__REMOTE_URLS__'] as
    | Record<string, string>
    | undefined;
  if (fromWindow?.[name]) {
    return fromWindow[name];
  }
  return `/remotes/${name}/remoteEntry.js`;
}

/**
 * Load 1 exposed module từ remote. Wrapper mỏng quanh import() federation —
 * bắt lỗi remote-down để shell render error boundary thay vì trắng trang (SF-5 task).
 */
export async function loadRemoteModule<T>(remote: RemoteEntry, exposedModule: string): Promise<T> {
  // Runtime API loadRemote muốn 'tasks/TasksPage' (KHÔNG './') — registry conventions/08
  // ghi exposes kiểu './TasksPage', chuẩn hoá tại đây để caller dùng nguyên văn registry.
  const containerKey = `${remote.name}/${exposedModule.replace(/^\.\//, '')}`;
  try {
    // [FLAG coordinator duyệt — SF-6 sửa READ-ONLY file, REQUIREMENT-GAP FI-62] Dùng runtime
    // API loadRemote thay native import(): dynamic import với specifier BIẾN không được
    // bundler rewrite (critical dependency warning) và import() native không resolve được
    // bare specifier — bug lộ khi SF-6 lần đầu load remote THẬT vào shell (trước đó shell
    // chỉ test remote-down mock). loadRemote là pattern chuẩn MF 2.0.
    const { loadRemote } = await import('@module-federation/enhanced/runtime');
    return (await loadRemote<T>(containerKey)) as T;
  } catch (err) {
    throw new Error(
      `Remote "${remote.name}" load failed (${remote.url}). Remote có thể đang down — shell phải render fallback. Nguyên nhân gốc: ${String(err)}`,
    );
  }
}
