# Code Review round 1 — SF-5 (VU-64) (outbox từ code-reviewer agent, 2026-10-17)

Scope: ce9ce7e..560694d (a494dab chính + b64d872 comment + 560694d security). 43 files, +282/-1337.
Coverage 43/43 file (bảng đầy đủ trong transcript agent); các vị trí position-verified tại HEAD.

## P1 (1)
- [P1][high] e2e.sh exit-code collision — vi phạm contract "exit N = fail bước N" mà commit tự
  tuyên bố bảo toàn: fail 7 ×6 (bước 6 stats VÀ bước 7 register), fail 8 (refresh VÀ saga
  create/PATCH), fail 9 (reuse VÀ saga poll), fail 10 (logout VÀ DLQ); header claim "exit tới 15"
  sai (max thực tế 12). Fix đề xuất: exit = nhãn + 1 tới 16 + sửa header.

## P2 (5)
- walkthrough.md:50 "alice 200" — script assert 204 (tasks.yaml)
- .claude/agents/e2e-runner.md:36 "PASS = 8 bước" — giờ 15
- app/shell/README.md:13 env cũ AUTH_MOCK_DEV_PASSWORD (đã rename AUTH_DEV_PASSWORD từ SF-1)
- README.md:21 mermaid authsvc còn trong subgraph platform; :7 header "6 services" không nhắc auth
- contracts.yml:91-93 register curl thiếu --max-time (pattern-consistent, không chặn)

## Deterministic (reviewer tự chạy lại)
bash -n SYNTAX-OK · compose config -q OK · init set -euo pipefail + đủ env ở 3 CI caller ·
Dockerfile node:22-alpine có wget · ci.compose.override.yml không tham chiếu auth-mock ·
token extraction shape-v2-safe (spring jq/go json.load/contracts sed) · convergence pipefail có ·
repo-wide auth-mock residue đúng ranh giới (iss-pinned + historical + services README stale
[go README:37 AUTH_MOCK_DEV_PASSWORD, spring README:12 TTL 8h — follow-up coordinator]).

## CHECKLIST-4Q
Q1 PASS (0 dòng service code; init SQL thuần 1 heredoc) · Q2 PASS (e2e CURL --max-time 5;
contracts register thiếu max-time = P2) · Q3 PASS (DLQ best-effort in stderr + ủy quyền CI qua
marker; logout-204-on-revoked là contract chủ đích) · Q4 PASS (user smoke-<ts> tồn lại by-design;
không partial-fail mới).

VERDICT: CHANGES-REQUESTED — P1: e2e.sh exit codes trùng — renumber unique + sửa header.

## Disposition (executor, commit 4cb0912)
P1: renumber theo rule exit = label+1 (register→8 … DLQ→16), header "exit = label+1 (tới 16,
unique từng bước)". Meta-test: grep fail N — mỗi code đúng 1 block; e2e re-run 15/15 PASS.
Cả 5 P2 fix cùng commit. → re-review round 2.

---

# Code Review round 2 — RE-REVIEW (2026-10-17)

Scope delta: 560694d..4cb0912 (9 files). Full story diff: ce9ce7e..4cb0912.

## P1 r1 — ĐÃ ĐÓNG (position-verified tại HEAD)
Mapping exit-code unique đúng rule exit = nhãn+1: 1=prereq · 2=ready · 3=login · 4=baseline ·
5=create · 6=feed · 7=stats · 8=register · 9=refresh · 10=reuse · 11=logout · 12=RBAC-user ·
13=RBAC-alice · 14=saga · 15=poll · 16=DLQ. Header đúng sự thật. Meta-test reviewer tự chạy:
grep uniq per block ✓ + e2e 15/15 exit 0.

## P2 r1 — cả 5 ĐÃ ĐÓNG (walkthrough 204 / e2e-runner 15 bước / shell README env /
README mermaid+header / contracts --max-time 10).

## 3 file thêm trong 4cb0912 soi riêng: improvements-log (learnings đúng format) ·
plan.md (CHỈ tick, KHÔNG rewrite prose sai — audit-trail sạch) · evidence walkthrough (out of scope code).

## CHECKLIST-4Q (round 2)
Q1 PASS · Q2 PASS (--max-time 5 + 10; poll 3) · Q3 PASS (DLQ best-effort + marker CI) · Q4 PASS.

Follow-up ngoài SF-5 (coordinator): services/{go,spring,node}-svc README stale
(AUTH_MOCK_DEV_PASSWORD / TTL 8h / auth-mock) — ngoài touch map READ-ONLY; gom cụm iss-rename
hoặc docs-hygiene.

VERDICT: APPROVED — P1 + 5 P2 đã đóng đều position-verified, mapping exit-code unique đúng
rule, không finding mới trong 4cb0912.
