// F1 (review VU-53 follow-up): retry BUG-2 (mf-bootstrap registerRemotes force) phải
// re-register remoteEntry với ĐÚNG url webpack đã đăng ký lúc build — không phải fallback
// '/remotes/<name>/remoteEntry.js' (sai trong dev-native shell :3000 — devServer chỉ proxy
// /api/*, không serve /remotes/* → fetch 404 → sticky-rejection được thay bằng
// wrong-URL rejection, retry hỏng vĩnh viễn).
// Cơ chế = thiết kế SF-5 trong docstring fe-shared (host inject __REMOTE_URLS__ lúc
// bootstrap) — trước đây host CHƯA implement. Pattern giống __API_BASE_URL__:
// DefinePlugin inject env build-time (REMOTE_TASKS_URL/REMOTE_ACTIVITY_URL — cùng nguồn
// với remotes config trong rspack.config.mjs) → nạp vào global trước khi render.

/** Nạp URL remote build-time vào `__REMOTE_URLS__` — gọi MỘT LẦN ở entry host
 * (bootstrap.tsx) TRƯỚC khi mount App (trước mọi loadRemote/retry). */
export function registerBuildtimeRemoteUrls(): void {
  (globalThis as Record<string, unknown>)['__REMOTE_URLS__'] = {
    tasks: __REMOTE_TASKS_URL__,
    activity: __REMOTE_ACTIVITY_URL__,
  };
}
