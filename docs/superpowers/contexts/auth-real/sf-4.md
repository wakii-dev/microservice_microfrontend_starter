# SF-4 Context Pack — FE refresh-client + LoginPage register
> Epic spec: docs/superpowers/specs/2026-10-17-auth-real-design.md · Plan Task 4: docs/superpowers/plans/2026-10-17-auth-real-plan.md · Bracket: docs/superpowers/mindmaps/auth-real.wakii · Linear: VU-63. Depends on: SF-1 (auth.yaml v2 — response shape `{user, accessToken, refreshToken}`, DROP tokenType/expiresIn).

## Spec slice
1. `app/shared/src/refresh-client.ts` (FILE MỚI + export qua index.ts — token-storage.ts READ-LOCKED không đụng): `login/register/withRefresh/logout`. Access → tokenStorage (API có sẵn: setToken/clearToken); refresh → `localStorage['bp.rt']` (rationale pin token-contract v2). 401 → refresh single-flight (promise lock) đúng 1 lần → retry; refresh fail → clear 2 key + throw Unauthorized.
2. `app/shell/src/pages/LoginPage.tsx`: tab Login/Register (response v2 shape — LoginPage hiện đọc tokenType/expiresIn phải bỏ); lỗi 401/409 theo messages contract. **Tailwind v4 đã trên main (PR #13) — UI mới theo pattern Tailwind hiện hành, KHÔNG css-scoped cũ.**
3. `app/shell/src/api.ts`: login/register đi qua wrapper.
4. Tests (mock fetch): login/register lưu cặp đúng key; 401 → refresh đúng 1 lần → retry OK; refresh 401 → clear + Unauthorized; logout revoke + clear. Coverage gate 90/90/80/90 giữ; a11y suite (tab/form mới) giữ.

## Touch map (SF-4 sở hữu)
`app/shared/src/refresh-client.ts` (mới) · `app/shared/src/index.ts` (export) · `app/shell/src/pages/LoginPage.tsx` · `app/shell/src/api.ts` · `app/shell/tests/*`.
READ-ONLY: `app/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts` (READ-LOCKED), `app/ui-kit/**` (consume primitives), remotes.

## ACCEPTANCE (user-visible)
- User đăng ký tài khoản mới từ UI → login → thấy nav user chip.
- Access token hết hạn (giả lập TTL ngắn/mock) → request kế tiếp tự refresh — UI KHÔNG thấy 401.
- Logout → 2 key sạch, về login.

## Boundary (KHÔNG làm)
KHÔNG sửa READ-LOCKED; KHÔNG đụng remotes tasks/activity (chỉ shell); KHÔNG làm cross-tab sync (SF-5 human walkthrough); KHÔNG đụng auth-svc/node (SF-2/SF-3).
