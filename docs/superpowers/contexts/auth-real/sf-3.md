# SF-3 Context Pack — node-svc RBAC: DELETE admin-only
> Epic spec: docs/superpowers/specs/2026-10-17-auth-real-design.md · Plan Task 3: docs/superpowers/plans/2026-10-17-auth-real-plan.md · Bracket: docs/superpowers/mindmaps/auth-real.wakii · Linear: VU-62. Depends on: SF-1 (contracts; kỹ thuật có thể đứng độc lập — roles claim đã có trong token hiện tại). Tier Standard (SF nhỏ).

## Spec slice
1. `services/node-svc/src/plugins/auth.ts`: xác nhận request.user mang `roles` (decode từ claims — đã có).
2. `services/node-svc/src/routes/tasks.ts`: preHandler DELETE `/tasks/:id` — reject 403 envelope `{code:"FORBIDDEN"}` khi `!user.roles?.includes('admin')` (message: 'Chỉ admin được xoá task').
3. Tests (RED trước): DELETE token roles `["user"]` → 403 envelope; alice admin → 200; missing roles → 403.

## Touch map (SF-3 sở hữu)
`services/node-svc/src/plugins/auth.ts` · `services/node-svc/src/routes/tasks.ts` · `services/node-svc/src/app.test.ts`.
READ-ONLY: mọi thứ khác.

## ACCEPTANCE (user-visible)
- Bob (roles user) thử xoá task qua API → 403 envelope rõ ràng; Alice (admin) xoá → 200. (e2e user-visible assert ở SF-5.)

## Boundary (KHÔNG làm)
KHÔNG đụng auth-svc (SF-2), FE (SF-4), e2e.sh (SF-5 thêm assert RBAC), PATCH/POST tasks (chỉ DELETE).
