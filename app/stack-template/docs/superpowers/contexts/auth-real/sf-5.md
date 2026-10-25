# SF-5 Context Pack — Convergence + decommission + CI swap + docs
> Epic spec: docs/superpowers/specs/2026-10-17-auth-real-design.md · Plan Task 5: docs/superpowers/plans/2026-10-17-auth-real-plan.md · Bracket: docs/superpowers/mindmaps/auth-real.wakii · Linear: VU-64. Depends on: SF-2 + SF-3 + SF-4 (đã merge về dest).

## Spec slice
1. **Thực thi gap-answer 8 mục** (SF-1 soạn, coordinator APPROVED — đọc `docs/superpowers/contexts/auth-real/gap-answer.md` + epic comment): compose entry auth-mock→auth-svc (+depends_on key) · nginx upstream · go-svc env value `http://auth-svc:8090` · users.json mount · init role auth_svc · .env renames · workspace line (đã có từ SF-2).
2. **Xoá `platform/auth-mock/`** (thư mục + mọi tham chiếu sống).
3. **CI swap**: `contracts.yml` boot auth-svc + nới schemathesis full paths (bỏ scope SF-1); `services-go-svc.yml` + `services-spring-svc.yml` boot auth-svc. Node workflow không đổi (iss pinned). **Acceptance: TOÀN BỘ CI main xanh sau merge.**
4. **e2e.sh mở rộng** (bảo toàn: exit N = fail bước N, marker `SAGA_TASK_ID=`, SMOKE_SAGA=0 exit 0): +register `smoke-<ts>@demo.local` → refresh → reuse old → 401 → logout; +RBAC: register user roles ["user"] DELETE task → 403, alice → 200.
5. **Docs sync CÙNG commit**: walkthrough (+register/refresh + gotcha `down -v` 1 lần — volume cũ thiếu role auth_svc + sync số bước PASS), CLAUDE.md (auth-mock → auth-svc), orca.yaml (services entry + gotcha + test_all), README, toolchain, grep `auth-mock` = rỗng trên docs/CLAUDE.md/orca.yaml/README/.env.example/.github (token-contract/users.json $comment giữ note lịch sử).
6. **Security pass + human walkthrough 2 tab** (register→login→tab 2→logout-all→tab 1 chết ở request kế tiếp) — evidence `docs/superpowers/evidence/auth-real/`.

## Touch map (SF-5 sở hữu)
compose · nginx · init · 3 CI workflows · e2e.sh · platform/auth-mock/ (xoá) · docs toàn bộ liên quan.
READ-ONLY: services/auth-svc, node, go, spring, app/** (code SF trước — bug thấy được = REPORT coordinator, KHÔNG fix — SF hội tụ).

## ACCEPTANCE (user-visible)
- Fresh clone + `down -v` → compose up → login alice bằng UI mới → saga demo fail@demo.local VẪN chạy (badge Gán thất bại) → bob tạo task, xoá bị chặn 403, alice xoá được.
- e2e mở rộng PASS; toàn CI main xanh; auth-mock không còn tồn tại trong repo.

## Boundary (KHÔNG làm)
KHÔNG fix bug miền service/FE (report); KHÔNG đổi contracts (rev2 là final); KHÔNG đụng Linear state epic (coordinator).
