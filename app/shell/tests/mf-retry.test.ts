import { afterEach, describe, expect, it, vi } from 'vitest';

// BUG-2 (sf-5b): "Thử lại" không ăn khi remote sống lại — sticky rejection trong MF
// runtime layer. Mini-model FAITHFUL với runtime 0.21.6 (đọc từ source cài đặt
// @module-federation/runtime-core/dist/index.esm.js):
//   1. getRemoteEntry() memoize load-promise remoteEntry trong `globalLoading`
//      (window.__GLOBAL_LOADING_REMOTE_ENTRY__, key = name+entry) — promise REJECTED
//      không bao giờ được clear → mọi loadRemote sau trả lại rejection cũ TỨC THÌ,
//      0 network request mới (đúng evidence bug report).
//   2. registerRemotes(remotes, {force:true}) → registerRemote force → removeRemote
//      xoá globalLoading + manifestCache + moduleCache + container global → loadRemote
//      sau đó fetch lại remoteEntry thật (đường sanctioned duy nhất trong runtime).
// Model chỉ giữ đúng 2 contract này — khẳng định hành vi đầu-cầu của lớp runtime.
const runtime = vi.hoisted(() => ({
  globalLoading: new Map<string, Promise<unknown>>(),
  fetchCount: 0,
  remoteUp: false,
}));

vi.mock('@module-federation/enhanced/runtime', () => ({
  loadRemote: (id: string) => {
    if (!runtime.globalLoading.has(id)) {
      runtime.fetchCount += 1;
      runtime.globalLoading.set(
        id,
        runtime.remoteUp
          ? Promise.resolve({ default: { sentinel: 'LOADED' } })
          : Promise.reject(new Error('RUNTIME-008: remoteEntry load fail')),
      );
    }
    return runtime.globalLoading.get(id);
  },
  registerRemotes: (remotes: Array<Record<string, unknown>>, options?: { force?: boolean }) => {
    if (options?.force) {
      // Contract với registration gốc của webpack runtime: remote entry = type 'global'.
      // Def lệch type (vd 'module') làm runtime fetch xong rồi chết ở RUNTIME_002
      // (init undefined trên module namespace) — bắt được ở browser E2E, chặn tại đây.
      for (const r of remotes) {
        if (r.type !== 'global') {
          throw new Error(`retry def phải type 'global', nhận: ${String(r.type)}`);
        }
      }
      runtime.globalLoading.clear();
    }
  },
}));

import { loadRemoteModule } from '@wakii/fe-shared';

afterEach(() => {
  runtime.globalLoading.clear();
  runtime.fetchCount = 0;
  runtime.remoteUp = false;
});

const REMOTE = { name: 'tasks' as const, url: 'http://localhost:4001/remoteEntry.js' };

describe('loadRemoteModule retry (BUG-2 sticky rejection)', () => {
  it('retry sau khi remote sống lại phải fetch LẠI remoteEntry (force reset sticky layer)', async () => {
    await expect(loadRemoteModule(REMOTE, './TasksPage')).rejects.toThrow(/tasks/);
    expect(runtime.fetchCount).toBe(1);

    runtime.remoteUp = true; // remote sống lại (như acceptance #5)
    await expect(
      loadRemoteModule(REMOTE, './TasksPage', { retry: true }),
    ).resolves.toMatchObject({ default: { sentinel: 'LOADED' } });
    // RED pre-fix: fetchCount vẫn 1 — runtime trả rejection sticky, không fetch mới
    expect(runtime.fetchCount).toBe(2);
  });

  it('không có cờ retry → giữ nguyên hành vi (không reset cache khi remote chưa sống lại)', async () => {
    await expect(loadRemoteModule(REMOTE, './TasksPage')).rejects.toThrow(/tasks/);
    await expect(loadRemoteModule(REMOTE, './TasksPage')).rejects.toThrow(/tasks/);
    expect(runtime.fetchCount).toBe(1);
  });
});
