# Plan: SF-4 spring-svc @Transactional demo (FI-78)
Date: 2026-10-13 | Linear: FI-78 | Worktree: sf-4-spring-tx-demo (branch __STACK_ORG__/sf-4-spring-tx-demo)
Spec slice: docs/superpowers/contexts/sf-4.md · Epic spec rev 3 §SF-4 · Story FI-76

## 0. Root cause analysis (WHY)
### Root cause
Epic FI-76 dạy 2 tình huống transaction: Situation B (cross-service saga: SF-2/SF-3) và
Situation A (nhiều step CÙNG 1 DB — 1 transaction là đủ). spring-svc hiện CHƯA có service layer:
`TeamController` gọi thẳng `TeamRepository`, team + members được ghi bằng MỘT `save()` cascade —
không thể demo "fail giữa chừng nhiều step → rollback toàn bộ".
### Current state (before feature)
POST /api/users/teams lưu team + members trong 1 cascade; không có chỗ nào chứng minh được
@Transactional rollback nhiều lệnh ghi. Thành viên copy boilerplate thiếu mẫu Situation A.
### Expected outcome
`service/TeamService` tạo team qua N lệnh ghi riêng biệt (teams.save + team_members từng dòng);
member trùng `alice@demo.local` (fixture có sẵn) ở giữa → throw → rollback toàn bộ; test assert
QUA REPOSITORY rằng DB không còn team lẫn members (Rule 0).
### Constraints & hardships
Dev machine KHÔNG Docker/JDK → mvnw verify chỉ chạy trong CI (postgres service container,
workflow hiện có). KHÔNG đổi API contract teams (path/shape giữ nguyên). KHÔNG đụng
compose/contracts/users.json (file của SF-1/epic). KHÔNG dính Kafka.
### High-level strategy
Thêm service layer mỏng giữa controller và repository; chuyển ghi members từ cascade sang
insert từng dòng qua repository; trigger rollback deterministic theo email fixture.

## 1. Problem (intent, NOT solution)
Thiếu mẫu Situation A (@Transactional nhiều step 1 DB) trong boilerplate — người học không có
code tham chiếu khi nào 1 transaction là đủ (so với Situation B cần saga).

## 2. Scope
- In scope: TeamService (mới) + TeamController delegate + TeamRepository helpers + tests
  (happy + rollback assert qua repository + envelope 409) + README section Situation A vs B.
- Out of scope: Kafka/outbox/compose/users.json/contracts; ĐỔI path/shape API teams; user mới
  trong fixture; docker local.
- Success criteria (observable):
  1. POST team members hợp lệ → 201, team + members CÓ trong DB (assert qua repository).
  2. POST team member trùng alice@demo.local ở vị trí giữa → error envelope 409
     (`$.error.code = CONFLICT`), DB KHÔNG có team lẫn members (assert qua repository).
  3. CI services-spring-svc xanh: `mvnw verify` + boot-smoke + drift-guard không vỡ.

## 3. Touch map
- Files modify:
  - `services/spring-svc/src/main/java/com/example/springsvc/service/TeamService.java` (MỚI)
  - `services/spring-svc/src/main/java/com/example/springsvc/domain/TeamRepository.java` (thêm
    `insertMember` native + `existsByName` + `countMembersByTeamName` + `deleteByName` cho test cleanup)
  - `services/spring-svc/src/main/java/com/example/springsvc/web/TeamController.java` (delegate,
    bỏ @Transactional khỏi controller)
  - `services/spring-svc/src/test/java/com/example/springsvc/service/TeamServiceRollbackTest.java` (MỚI)
  - `services/spring-svc/src/test/java/com/example/springsvc/web/TeamApiTest.java` (swap alice
    khỏi happy tests — alice giờ là rollback trigger; thêm test envelope 409)
  - `services/spring-svc/README.md` (section @Transactional demo)
- Consumers/regression candidates: TeamApiTest (dùng ALICE làm member — PHẢI swap); boot-smoke CI
  (không tạo team — an toàn); FE/node callers (contract giữ nguyên).
- Shared surfaces: KHÔNG đổi API/DB schema/config. `team_members` DDL giữ nguyên.

## 4. Design
- Approach chosen (A): giữ nguyên entity `Team` (@ElementCollection) + thêm native
  `INSERT INTO team_members` trên `TeamRepository` — service gọi từng dòng. Lý do: touch map
  nhỏ nhất, không thêm entity/id-class, đọc members (getTeam/list) vẫn qua collection như cũ.
- Alternatives considered:
  - (B) Entity `TeamMember` + `TeamMemberRepository` riêng: chuẩn hơn về mặt học thuật nhưng
    thêm entity + @EmbeddedId chỉ để demo — drive-by abstraction (P2 surgical scope).
  - (C) JdbcTemplate trong service: bỏ qua repository — trái spec slice ("từng dòng qua repository").
- Edge cases / second-order effects:
  - `saveAndFlush` step 1 — native INSERT phải chạy SAU khi teams row có mặt (FK team_members).
  - Response createTeam echo deduped memberIds từ service (collection của entity KHÔNG bị native
    insert cập nhật — không mutate managed collection, tránh cascade ghi trùng PK).
  - Member UUID không tồn tại trong users: giữ nguyên hiện trạng (không FK — chấp nhận, qua qua);
    trigger chỉ kích hoạt khi user tồn tại + email khớp.
  - Dedupe LinkedHashSet giữ insertion order → "vị trí giữa" deterministic.
- Non-functional: không đổi perf surface (vẫn 1 tx/request); error envelope theo conventions/04.

## 5. Implementation outline
- Tasks (ordered):
  - [x] 1. TeamRepository: `insertMember` (@Modifying native), `existsByName`, `countMembersByTeamName`, `deleteByName`.
  - [x] 2. TeamService (MỚI): `@Transactional createTeam(name, memberIds)` — validate name, dedupe,
     saveAndFlush team, loop members: lookup users repo → email trùng trigger → ApiException.conflict
     (409 CONFLICT) TRƯỚC khi insert member đó; ngược lại `insertMember`.
  - [x] 3. TeamController: delegate sang service (validate DTO giữ ở controller), bỏ @Transactional.
  - [x] 4. TeamServiceRollbackTest (MỚI, KHÔNG @Transactional — server tx thật; cleanup @AfterEach):
     happy path assert DB qua repository; rollback assert `existsByName=false` +
     `countMembersByTeamName=0`; thêm case trigger ở vị trí đầu.
  - [x] 5. TeamApiTest: swap alice → bob/carol trong dedupe + echo tests; thêm test envelope 409 trigger.
  - [x] 6. README: section "Situation A vs B".
- File structure: `service/` package mới ngang `web/`, `domain/` (Spring convention).
- Testing strategy: MockMvc @SpringBootTest trên postgres service container (CI) — integration
  tests là chính (đúng bản chất @Transactional demo); assert Rule 0 qua repository.

## 6. Risks & unknowns
- Must verify: `mvnw verify` trong CI (dev machine không JDK — KHÔNG chạy local).
- Unverified assumptions:
  - Native INSERT + saveAndFlush cùng tx hoạt động đúng thứ tự (đã có saveAndFlush chặn; CI test
    happy path sẽ chứng minh).
  - Derived `deleteByName` + DB cascade ON DELETE CASCADE dọn team_members trong test cleanup.
- Trigger test data: ALICE=11111111-1111-4111-8111-111111111111, BOB=22222222-…, CAROL=33333333-…
  (đã đối chiếu contracts/auth/users.json — KHÔNG sửa file này).
