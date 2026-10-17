import { afterEach, describe, expect, it } from 'vitest';
import { resolveRemoteUrl } from '@boilerplate/fe-shared';
// F1 (review VU-53 follow-up): host CHƯA BAO GIỜ inject __REMOTE_URLS__ dù docstring
// fe-shared thiết kế vậy — retry BUG-2 (registerRemotes force) re-register remoteEntry
// với resolveRemoteUrl() → fallback '/remotes/<name>/remoteEntry.js' SAI trong dev-native
// (shell :3000 không serve /remotes/* — devServer chỉ proxy /api/*) → 404 vĩnh viễn,
// retry thay sticky-rejection cũ bằng wrong-URL rejection. Fix: host nạp build-time env
// (DefinePlugin __REMOTE_TASKS_URL__/__REMOTE_ACTIVITY_URL__) vào __REMOTE_URLS__.
import { registerBuildtimeRemoteUrls } from '../src/remote-urls';

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['__REMOTE_URLS__'];
});

describe('registerBuildtimeRemoteUrls (retry phải dùng đúng url webpack đã đăng ký)', () => {
  it('nạp __REMOTE_URLS__ từ build-time define → resolveRemoteUrl trả ĐÚNG url đó', () => {
    registerBuildtimeRemoteUrls();
    // giá trị define trong vitest.config.mô phỏng DefinePlugin build-time
    expect(resolveRemoteUrl('tasks')).toBe('http://buildtime:4001/remoteEntry.js');
    expect(resolveRemoteUrl('activity')).toBe('http://buildtime:4002/remoteEntry.js');
  });

  it('KHÔNG đăng ký → resolveRemoteUrl giữ fallback prod (qua gateway conventions/08)', () => {
    expect(resolveRemoteUrl('tasks')).toBe('/remotes/tasks/remoteEntry.js');
  });
});
