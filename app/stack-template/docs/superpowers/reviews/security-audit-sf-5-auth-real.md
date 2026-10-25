# Security Audit — SF-5 auth-real VU-59/VU-64 (outbox từ security-audit agent, 2026-10-17)

## Executive Summary
**Overall Risk**: Low · **Vulnerabilities Found**: 4 (0 Critical, 0 High, 4 P2 hygiene/defense-in-depth)
**Kết luận acceptance**: **PASS** — **0 P0 / 0 P1**. Diff là thuần expose/swap (auth-mock → auth-svc):
compose entry, postgres init role, nginx upstream, CI swap, e2e mở rộng 15 bước, docs sync.
Không có code auth-svc trong diff (của SF trước, đúng phạm vi). 5 quyết định đã-accepted
(localStorage bp.rt / iss pinned / AUTH_DEV_PASSWORD default / gateway presence-check /
schemathesis full) đều verify đúng ghi nhận — không reopen.

## A1–A6
- **A1 heredoc injection (01-init.sh:24)**: vector cú pháp CÓ, không attacker-reachable (input = .env operator
  + CI hardcode); password chứa `'` → ON_ERROR_STOP fail-closed. Pattern tiền-existing ×5 role → P2-1.
- **A2 temp files + leak**: trap ĐỦ (REGISTER_BODY/REFRESH_BODY/RBAC_403_BODY init trước trap, đủ trong rm -f);
  bước 9/10 `-o /dev/null`; say không in token. Lỗ hẹp: fail-branch cat body register/refresh nếu service
  buggy trả success-code-sai kèm token → **P2-2** (cùng pattern contracts.yml:93).
- **A3 secret leak trong log/healthcheck**: sạch — healthcheck probe không secret, không shell tracing,
  login response không in. `echo "$PAYLOAD"` in JWT claims (không signature) ra CI log → **P2-3**.
- **A4 docs mở lỗ**: walkthrough 4a hướng dẫn dán token vào curl → shell history (bp.rt dài hạn) → **P2-4**.
- **A5 RBAC assert**: ĐỦ — 403 status + envelope FORBIDDEN + alice 204; CI coverage qua convergence e2e.
- **A6 exposure auth_svc/cross-schema**: sạch — GRANT chỉ schema auth, search_path auth, users.json :ro
  không password, PG16 thu hồi CREATE public khỏi PUBLIC.

## P2 (đề xuất fix)
| ID | Issue | Location |
|---|---|---|
| P2-1 | SQL literal breakout qua password chứa `'` (fail-closed, operator-controlled) | platform/postgres/init/01-init.sh:24 |
| P2-2 | Fail-branch cat body register/refresh có thể in token nếu service buggy | scripts/smoke/e2e.sh:172,183 + contracts.yml:93 |
| P2-3 | echo JWT claims ra CI log (không signature — hygiene) | contracts.yml:100 |
| P2-4 | Docs demo dán token vào curl → shell history | docs/walkthrough.md:111-114 |

Repo-hygiene: 0 .env/pem/key trong diff; exec-bit 0; không chmod/sudo/curl|sh; lockfile chỉ XOÁ (auth-mock).

## Disposition (executor, commit 560694d)
Cả 4 P2 đã fix: P2-2 fail-branch in field-names thay body (e2e.sh + contracts.yml, + rm /tmp/reg.json);
P2-3 bỏ echo payload; P2-4 mẫu read -rs + unset; P2-1 comment ràng buộc quote (psql :'var' binding cho
cả 5 role = follow-up — fix 1/5 role thôi sẽ lệch style trong cùng file).

VERDICT: FINDINGS — P0: 0 · P1: 0 · P2: 4 — sạch cho acceptance SF-5
