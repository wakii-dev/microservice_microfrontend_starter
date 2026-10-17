# Wakii Playbook — tổ chức story cho boilerplate

Cách dùng story-workflow (Wakii) khi phát triển **chính repo này** và project scaffold từ nó
(`scripts/scaffold/scaffold.sh` copy `docs/` — trừ `docs/superpowers/` — nên playbook ở `docs/`
đi theo project mới).

**Đọc khi nào:** sắp có việc lớn hơn 1 task, cần quyết chia story hay làm lẻ — và khi chia
rồi, tra công thức slice theo loại epic. **Không lặp** nội dung skill (`story-workflow`,
`orca-superpowers-workflow`) — ở đây chỉ có phần *riêng của boilerplate*: archetype chia SF,
thứ tự đụng file theo conventions, gates nào đỏ vì gì. Quy tắc vàng ở [CLAUDE.md](../CLAUDE.md);
kiến trúc ở [walkthrough.md](walkthrough.md); "vì sao" ở `docs/adr/`.

> Bài học chung của 3 story đã qua (FI-62 micro-boilerplate · FI-76 kafka-outbox-saga ·
> VU-53 ui-redesign):
> chi phí lớn nhất không phải code — là **slice sai**: SF quá to (review không kịp), quá nhỏ
> (overhead gate > giá trị), hoặc phụ thuộc ngầm (2 SF đụng cùng file → worker chặn nhau ở Phase 4).

---

## 1. Khi nào dùng gì (decision tree)

| Việc | Dùng | Ví dụ thật trong repo |
|---|---|---|
| >3 sub-feature **hoặc** >10 tasks, nhiều người/agent làm song song | **Story mode** — epic Linear + mindmap `.wakii` + SF sub-issues, bracket theo tier | FI-62 (7 SF), FI-76 (5 SF), VU-53 (5 SF tier bracket) |
| 1 sub-feature hoàn chỉnh, 3–10 tasks | **Single workflow** — `orca-superpowers-workflow` trên 1 Linear issue, đủ Phase 0–5 | từng SF FI-64..FI-75 chạy đơn lẻ giai đoạn đầu FI-62 |
| Fix 1 điểm rõ gốc rễ, không đụng contract/port | Fix trực tiếp + test, không story | `fix(auth-mock): assert user count theo fixture` (ee0117c) |
| Đổi behavior có MainPage động | 1 story nhỏ 2–3 SF vẫn ổn — đừng ép story mode chỉ vì "to" | — |

Ngưỡng mờ: **2 SF mà có phụ thuộc tier (một cái Unblock hẳn cái kia) → story mode** — bracket
tier là giá trị thật, không phải ceremony.

---

## 2. Bốn archetype epic — công thức chia SF

Trước khi CREATE story, trả lời 5 câu (ghi vào epic summary):

1. Đụng **contracts/** không? (OpenAPI / DDL / event / users.json) — đụng là SF-1 contracts, không ghép với impl.
2. Đụng **port hoặc route gateway** không? — kích hoạt quy tắc 4 chỗ (conventions/05 + .env.example + compose + README cùng commit).
3. Đụng **READ-LOCKED** không? (`app/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts`, `package.json#mfToolkit`, catalog pins) — cần epic duyệt + re-spike qua `app/spike`.
4. Cần **secret/env mới** không? — liệt kê vào `.env.example` ở SF-1, không để SF cuối mới discover.
5. Chạy **song song được không?** — SF cùng tier KHÔNG được đụng cùng file; đụng → tách tier.

Rồi tra archetype:

### CC — Cross-cutting contract
*Đổi thứ mọi thứ phụ thuộc: auth thật, error envelope v2, thêm field event, đổi envelope shape.*

- **Slice theo tầng, không theo service:** SF-1 contracts + gateway route → tier 1 services thích ứng (song song) → tier 1 FE → tier 2 convergence + decommission cái cũ.
- **SF-1 là hiệp ước:** code sau phải theo spec rev đó; đổi spec giữa chừng = rollback SF-1, không vá lẻ.
- **Gates:** drift-guard CI (snapshot `activity.yaml` nhúng trong go-svc phải bit-identical `contracts/openapi/activity.yaml`), schemathesis contracts CI, human walkthrough ở convergence.
- **Rủi ro đặc trưng:** CI convergence đỏ liên hồi trong giai đoạn chuyển (2 nửa đổi không cùng lúc) → SF-1 phải giữ **tương thích ngược có kiểm soát** (token cũ còn verify, event cũ còn consume) hoặc đổi đồng loạt trong 1 SF duy nhất — chọn một, ghi rõ trong epic summary.
- Mẫu sống: chương 4 (epic auth thật).

### NS — Service mới
*Thêm service vào demo (vd notification-svc consume task-events).*

- **Câu hỏi làm rõ TRƯỚC khi tính slice** (mỗi câu đổi hình dạng SF-1):
  | Câu hỏi | Hệ quả kỹ thuật |
  |---|---|
  | Sync hay async? | Có Kafka → conventions/09 + topic tạo tường minh trước consumer |
  | Ngôn ngữ nào? | Node ngoài workspace → standalone lockfile (variant conventions/01); Go → drift-guard snapshot + distroless không healthcheck shell (conventions/02) |
  | Có DB riêng? | DDL vào `contracts/db/` + role schema-only trong postgres init + migration pattern (drizzle/Flyway/auto) |
  | Port mấy? | Quy tắc 4 chỗ cùng commit (conventions/05 + .env.example + compose + README) |
  | FE có hiển thị? | Có → tách SF riêng cho remote/page, không gộp vào SF impl |
- **Công thức 4 SF:** SF-1 khung (contracts OpenAPI + DDL + entry compose + CI workflow — impl rỗng nhưng boot + healthcheck xanh) → SF-2 impl API → SF-3 consumer/producer + FE hiển thị → SF-4 convergence e2e mở rộng.
- **Đừng đóng SF-1 trước khi** `docker compose up` riêng service boot được với role DB schema-only (bài học drizzle `CREATE SCHEMA` permission — improvements-log 2026-10-12).
- **Gates:** boot-smoke CI + drift-guard snapshot; conventions mới (nếu có) phải thuộc SF-1, không nhét SF cuối.
- **Rủi ro:** topic auto-create race → tạo topic tường minh TRƯỚC consumer subscribe (conventions/09; bug thật SF-3 kafka story: consumer kẹt im lặng, 0 fetch 0 error).

### FE — FE/UX epic
*Đổi UI đáng kể (mẫu: VU-53).*

- **Design trước, code sau, tier tách bạch:** design gate front-load NGAY LÚC CREATE (mock-prototype 3 hướng, user chọn, hand-off `docs/superpowers/designs/`) → SF-1 tier 0 design-system nền móng (tokens + primitives, không phá hiện trạng) → tier 1 từng vùng UI song song → tier 2 convergence + human browser walkthrough.
- **Quy tắc sống còn của tier 1:** mỗi SF một vùng file (`shell/` | `remotes/tasks` | `remotes/activity`); fe-shared chỉ tier 0 đụng; css scoped, không sửa style chung sau tier 0.
- **Gates:** direction-approved record trước SF-1; a11y test; walkthrough 8-acceptance + responsive 375px ở convergence (VU-53 precedent).
- **Rủi ro:** react/rspack/MF upgrade đụng catalog pins → **phải re-spike** qua `app/spike` trước, không nâng trong epic UI.

### IN — Infra/platform
*Observability, upgrade toolchain, đổi CI, compose.*

- **Slice theo lớp infra, tách phần compose khỏi phần code:** entry compose + env là 1 SF (verify bằng boot-smoke), code service thích ứng là SF sau — đừng trộn.
- **Quyền sửa compose:** `platform/docker-compose.yml` có lịch sử sở hữu ghi ở đầu file — SF nào cũng KHÔNG tự sửa nếu không được brief ủy quyền; muốn đổi → flag coordinator kèm gap-answer ghi lại vào comment compose (precedent SF-5/SF-6 FI-62).
- **Gates:** convergence e2e trên compose 10 services là gate thật (dev machine không Docker → verify qua CI, `gh run watch`); down-scale heap kafka 512m giữ nguyên cho CI 7GB.
- **Rủi ro:** secrets — thêm env mới = `:?set in .env` ép lỗi sớm; KHÔNG commit `.env`; story-guard-secrets chặn inline secret (export qua script file nếu cần override).

---

## 3. Checklist lifecycle (một dòng một pha)

- [ ] **Phase 0** — impact analysis (phase0-impact-analyst): touch map + blast radius trước khi viết dòng spec nào.
- [ ] **Spec** — brainstorm → `docs/superpowers/specs/YYYY-MM-DD-<topic>.md` → spec-critic GO trước khi plan.
- [ ] **Plan + DAG** — writing-plans-linear (subtask lên Linear) → plan-critic nếu ≥5 tasks; SF cùng tier không đụng cùng file.
- [ ] **CREATE story** — mindmap `.wakii` (tier + depends-on + Linear id từng SF) + context pack `contexts/<story>/sf-N.md` cho từng SF; FE epic: design gate xong TRƯỚC khi dispatch SF-1.
- [ ] **Dispatch theo tier** — tier 0 xong mới tier 1; context pack trả lời HẾT câu epic-level ("Đã trả lời hết epic-level — KHÔNG hỏi lại"); SF hội tụ KHÔNG fix bug miền khác, REPORT coordinator.
- [ ] **Execute mỗi SF** — contracts TRƯỚC code; TDD chỗ được, ghi `tdd: skipped-tdd: CI-only <lý do>` chỗ không (dev thiếu JDK/Docker); review ĐỘC LẬP verdict APPROVED materialize ra file.
- [ ] **Evidence** — `docs/superpowers/evidence/<sf>/` + `test-run.txt` ghi HEAD **tại lúc code commit cuối** (docs commit sau làm B1 flip FAIL — loop nổi tiếng của SF-3).
- [ ] **Gate SF** — `story-verify` B1–B3 sạch; executor KHÔNG merge, KHÔNG set Linear Done — coordinator làm cả hai.
- [ ] **Convergence (tier 2)** — full suite xanh + e2e 2 chiều PASS + browser walkthrough human gate + docs sync (walkthrough/README/orca.yaml cùng commit).
- [ ] **Merge + đóng** — coordinator merge SF về dest (story model); **dest → main qua PR** theo [git-flow.md](git-flow.md) (CI xanh + `--no-ff`, từ 2026-10-17 — không push thẳng main); epic Linear Done; xoá state run/task lệch (như case SF-5 `ready` còn treo sau khi main đã merge).
- [ ] **Post-task-ritual** — improvements-log.md ghi bài học (flag, KHÔNG tự sửa skill); archetype mới → cập nhật playbook này **cùng commit merge**.

---

## 4. Worked example — epic "Auth thật thay auth-mock" (archetype CC)

> ⚠️ Đây là **ví dụ minh hoạ công thức chia SF** — không phải spec auth. Khi epic được duyệt thật:
> brainstorm + spec riêng (câu 1–5 chương 2 + quyết định mở bên dưới), rồi mới CREATE story.

**Mục tiêu (draft):** thay auth-mock bằng service auth thật — register/login/refresh + enforcement
RBAC. `roles` (`user|admin`) đã có sẵn trong users.json + token contract (claims `sub/email/roles`,
Alice đã `admin`) — việc thật là **enforcement ở services + register/refresh**, không phải thêm
roles. Non-goals: OAuth/social, multi-tenant, rate-limit distributed.

**Decision points phải chốt ở Phase 0 (mỗi cái đổi hình dạng DAG):**

| Quyết định | Phương án | Hệ quả DAG |
|---|---|---|
| Port + path | auth-svc thật **đón luôn :8090 + giữ `/api/auth/*`** | gateway, conventions/05, .env, README **không đổi** — quy tắc 4 chỗ không kích hoạt (khuyến nghị) |
| Users schema | spring-svc đang owns users — auth-svc đọc qua API spring vs owns schema riêng | Nếu owns riêng: SF-2 thêm migration + role DB; nếu qua spring: SF-2/SF-3 ghép chặt → gộp 1 SF |
| Token contract | giữ claims `sub/email/roles` + thêm refresh/rotation (token-contract.md dòng 69 đã chốt: nâng OIDC thì claims giữ nguyên) vs đổi cấu trúc | Giữ: node/go sửa riêng từng SF khả thi; Đổi: buộc đồng loạt 1 SF |
| `token-storage.ts` READ-LOCKED | wrapper mới không đụng file locked vs epic duyệt sửa | Wrapper: SF FE gọn; Sửa: cần approval epic + re-spike |

**Slice SF đề xuất (bracket tier):**

- **SF-1 · tier 0 — Contracts + hiệp ước:** mở rộng `contracts/openapi/auth.yaml`
  (register/refresh), `contracts/auth/token-contract.md` v2 (refresh/rotation — claims
  `sub/email/roles` giữ nguyên), users.json **KHÔNG đổi** (UUID + roles đã chuẩn — saga fail-user
  `svc-fail` và seed spring còn khớp), env mới vào `.env.example`. Gate: spectral + schemathesis
  xanh; KHÔNG đụng code runtime.
- **SF-2 · tier 1 — auth-svc:** impl register/login/refresh (+ quyết định users-schema ở trên),
  auth-mock chuyển chế độ legacy-flag tạm. Gate: unit + integration token thật; compose boot xanh.
- **SF-3 · tier 1 — Services thích ứng (song song SF-2 nếu token shape giữ):** node-svc + go-svc
  middleware verify roles; go-svc service-token (`svc-activity`) đổi theo token contract; drift-guard
  snapshot không đổi nếu API không đổi. Đụng file khác SF-2/SF-4 hoàn toàn.
- **SF-4 · tier 1 — FE:** login giữ behavior + messages contract (test shell hiện có là reguação),
  thêm refresh flow; test shell hiện có (login behavior + error messages) là ràng buộc giữ nguyên;
  **`e2e.sh` hardcode `alice@demo.local`** → nếu password/flow đổi, SF này phải đồng bộ smoke script
  (hoặc SF-5 sẽ đỏ). READ-LOCKED theo decision ở trên.
- **SF-5 · tier 2 — Convergence + decommission:** e2e mở rộng login → refresh → RBAC 403 → saga
  fail-user **vẫn xanh**; tắt auth-mock (hoặc giữ `AUTH_MOCK_MODE=legacy`); docs sync 4 chỗ; human
  walkthrough cuối.

**Gates đắt tiền nhất của epic này:** (1) drift-guard + schemathesis ở SF-1; (2) CI convergence
đỏ trong window SF-2..4 nếu token shape đổi mà không giữ tương thích — đây là lý do decision
"token shape" phải chốt TRƯỚC khi CREATE; (3) human walkthrough SF-5.

---

## 5. Anti-patterns — bài học đã trả giá (từ 3 story + improvements-log)

| Anti-pattern | Hậu quả thấy thật | Quy tắc |
|---|---|---|
| Consumer subscribe khi topic chưa tồn tại (auto-create race) | Consumer kẹt im lặng — stable group, 0 fetch, 0 error (SF-3 kafka) | Tạo topic tường minh TRƯỚC boot consumer; không `depends_on kafka` |
| Evidence `test-run.txt` ghi hash, sau đó commit docs mới | Gate B1 flip FAIL không do code (SF-3, lặp 2 lần) | Hash ghi tại code commit cuối; story-verify chấp nhận docs-only sau hash |
| Bắt `orca run-create` trả top-level `id` | Lấy nhầm request-id → 9 task orphan ngoài run (FI-62) | Id thật ở `.result.run.id` / `.result.gate.id`; task-create validate run tồn tại |
| Executor tự nghĩ mình merge được | `story-verify` B4 FAIL mãi ở handoff | B4 executor-view = PENDING-MERGE; merge là việc coordinator |
| `sed -i` / `realpath -m` GNU-only trong script | Scaffold fail trên macOS (fix 2026-10-17) | Script dùng chung repo: detect BSD/GNU 1 lần, python3 thay `realpath -m` |
| pnpm `catalog:` + standalone install `--ignore-workspace` | `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND` (SF-7 copy-dir) | Mini workspace: sed catalog block từ root, install KHÔNG ignore-workspace |
| Đổi spec giữa chừng SF đang chạy | Rollback cả SF, mất 1 vòng review | Spec sai giữa chừng = STOP + REPORT coordinator, không vá lẻ trong SF impl |
| Test "ma" — tên có vẻ assert, thực chất không | Review APPROVED oan: phantom grep không assert gì (sf-5b phải rà lại) | Mỗi acceptance có 1 assert thật trỏ đúng behavior; reviewer đọc assert, không đọc tên test |

---

## 6. Cập nhật playbook

Epic mới không khớp archetype nào ở chương 2 → **đừng ép** vào archetype cũ. Merge mọi nhánh story về main qua PR (git-flow.md) — quy tắc này đè model merge-thẳng-dest của các story trước 2026-10-17. Thêm archetype mới
(định nghĩa + công thức slice + gates + rủi ro — cùng format) trong **cùng commit merge epic đó** —
cùng nguyên tắc với orca.yaml: descriptor đi cùng thay đổi nó mô tả, drift = lỗi onboarding.

Bài học một-lần-theo-epic cứ để improvements-log; bài học **lặp lại từ epic thứ hai** mới lên
playbook (tiêu chí lọc — không biến playbook thành nhật ký).
