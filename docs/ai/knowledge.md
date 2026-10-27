# Knowledge base — tri thức vận hành đã trả giá

Knowledge base tách bạch khỏi AGENTS.md: mục ở đây ghi **triệu chứng → nguyên nhân → cách xử lý** cho từng bẫy đã xảy ra thật (không phải lý thuyết), kèm bản đồ "việc X → file Y". AGENTS.md giữ bản tóm tắt 1 dòng; file này là chỗ tra cứu sâu. Khi bắt được một bẫy mới đáng nhớ: thêm mục dưới đây, rồi thêm 1 dòng tóm tắt vào §6 AGENTS.md.

Đọc theo thứ tự onboard xem [AGENTS.md](../../AGENTS.md). Nội bộ đội (roster, report log) không nằm trong repo docs công khai — bài học ở đây đã khái quát hoá, đủ để hành động.

## Recipes (viết UI)

- Code mẫu 20 công thức: [docs/ai/recipes.md](recipes.md) — import + copy-chạy được, mỗi recipe tự chứa imports.
- Quy tắc bắt buộc + anti-patterns + bản đồ feature → component: **Phần II** của [AGENTS.md](../../AGENTS.md).
- Visual truth: Storybook — `pnpm --filter ui-kit storybook` → http://localhost:6006.
- Customize slots (`classNames`/`style` cho mọi component): ghi chú "Customize (từ 0.7)" trong Phần II AGENTS.md.

## Gotchas — bẫy đã biết

Format mỗi mục: **Triệu chứng** → **Nguyên nhân** → **Xử lý**. Số thứ tự không mang priority — đều đã xảy ra thật.

### 1. npm registry propagate chậm sau publish

- **Triệu chứng**: vừa publish xong, `npx`/`pnpm add` từ máy khác (hoặc CI) vẫn thấy bản cũ, hoặc 404 version mới. Kết luận sai phổ biến: "publish hỏng" → publish lại → duplicates.
- **Nguyên nhân**: registry + CDN cần 2–5 phút propagate sau khi publish.
- **Xử lý**: đợi 2–5 phút rồi verify từ registry thật: `npm view <pkg> versions` / `npm view <pkg> dist-tags`. Đừng tin cache local. Cả việc cắt nhánh/publish từ main stale cũng từng xảy ra — luôn `git fetch` + pull trước khi publish.

### 2. Kafka topic phải tồn tại TRƯỚC khi consumer boot

- **Triệu chứng**: go-svc consume group `Stable`, không crash, nhưng assignment/feed rỗng vĩnh viễn; hoặc DLQ publish fail "Unknown Topic".
- **Nguyên nhân**: race — consumer join group trước khi topic được auto-create, rồi không fetch/commit offset nào.
- **Xử lý**: tạo topic tường minh TRƯỚC khi boot services: `task-events` + `task-events.dlq` (lệnh trong `run.compose` của [orca.yaml](../../orca.yaml); compose có sẵn one-shot `kafka-init`, go-svc có `EnsureTopics`). Khi debug: `down -v` rồi up lại theo đúng thứ tự.

### 3. Pipe nuốt exit-code

- **Triệu chứng**: `pnpm typecheck | tail -20` in output bình thường, tưởng PASS — thật ra typecheck FAIL, `$?` chỉ phản ánh `tail`.
- **Nguyên nhân**: trong shell, exit status của pipeline là của lệnh CUỐI; `tail`/`head` hầu như luôn exit 0.
- **Xử lý**: khi verify gate, chạy lệnh không pipe; hoặc đọc `${pipestatus[1]}` (zsh) / `${PIPESTATUS[0]}` (bash); hoặc `set -o pipefail`. Never kết luận PASS từ output đẹp.

### 4. Publish tarball copy tay mất file

- **Triệu chứng**: package publish xong nhưng consumer thiếu assets (CSS tokens, docs/assets, script mất +x) — bug chỉ lộ ở người dùng, không lộ trong repo.
- **Nguyên nhân**: script publish `cp` theo basename / copy tay từng thứ — dùng `files` field trong package.json không cứu được khi script tự copy đè.
- **Xử lý**: trước mọi publish: `npm pack` rồi soi nội dung tarball (`tar -tzf`) — đủ file cần, đúng quyền thực thi. Guard trong publish script kiểm file bắt buộc tồn tại.

### 5. Port conflict do dev server cũ còn treo

- **Triệu chứng**: dev server/boot báo `EADDRINUSE` hoặc browser thấy bản UI cũ bất thường ở port đó.
- **Nguyên nhân**: session trước chết mà không cleanup — dev server (vd ports 4101/4102, 6006…) vẫn LISTEN ngầm.
- **Xử lý**: `lsof -iTCP:<port> -sTCP:LISTEN` tìm PID rồi `kill <PID>` trước khi boot lại. Sau mỗi mission nên tắt sạch server mình mở.

### 6. Docker engine quá tải khi build song song

- **Triệu chứng**: docker build treo/sập giữa chừng (daemon không phản hồi), image dở dang.
- **Nguyên nhân**: 2 build image lớn chạy song song trên cùng engine (vd compose build + demo riêng) đẩy engine quá tải.
- **Xử lý**: build tuần tự. Engine đã sập: restart Docker Desktop sạch rồi build lại; xóa image dở dang nếu cần (`docker builder prune`).

### 7. Branch slug sai pattern

- **Triệu chứng**: push bị chặn bởi pre-push hook: `branch … vi phạm rule wakii-dev/…`.
- **Nguyên nhân**: slug chứa dấu chấm, chữ hoa, underscore — regex chuẩn là `^wakii-dev/(story|sf|fix|docs|chore|feat)-[a-z0-9][a-z0-9-]*$`.
- **Xử lý**: `git branch -m <tên-mới>` ngay khi tạo nhánh (đã từng có nhánh phải rename muộn, thậm chí commit rơi nhánh khác).

### 8. `manager-head.html` badge tự sinh — đừng commit

- **Triệu chứng**: `git status` luôn hiện `M app/ui-kit/.storybook/manager-head.html` dù không ai sửa.
- **Nguyên nhân**: `scripts/stamp-build.cjs` chạy trước mỗi `storybook dev`/`build`, ghi build-id (version + git sha + giờ) vào badge trong file đó.
- **Xử lý**: dirty là chuyện thường — không `git add` file này; nếu lỡ vào commit, revert phần badge về giá trị cũ.

### 9. Vitest ranh giới ngày

- **Triệu chứng**: test liên quan ngày/month qua local nhưng đỏ ở CI (hoặc ngược lại).
- **Nguyên nhân**: máy dev +07 (hoặc TZ khác) làm mép ngày trôi; test dùng thời gian thật.
- **Xử lý**: TZ đã pin trong `vitest.config.ts` (`test.env`) của từng package — đừng bỏ pin; test thời gian phải inject `now` thay vì đọc clock thật.

### 10. node-svc / auth-svc standalone lockfile

- **Triệu chứng**: `pnpm install` ở root xong mà service vẫn thiếu deps, hoặc lockfile service bị workspace ghi đè.
- **Nguyên nhân**: 2 service này standalone lockfile, cố tình không tham gia workspace.
- **Xử lý**: `cd services/<svc> && pnpm install --frozen-lockfile --ignore-workspace` — chạy TRONG thư mục service, không phải root.

### 11. pgdata volume cũ thiếu seed mới

- **Triệu chứng**: boot lên thiếu user saga-seed / role `auth_svc` / schema `auth`, auth hoặc saga lỗi lạ.
- **Nguyên nhân**: init script chỉ chạy lúc volume MỚI; volume từ bản cũ không có seed thêm (Flyway V2, auth-real SF-5).
- **Xử lý**: `docker compose --env-file platform/.env down -v` 1 lần rồi up lại; `.env` bản cũ bổ sung `AUTH_SVC_DB_PASSWORD` từ `.env.example`. (Chú ý: compose project dùng chung giữa các worktree — `down -v` ở đây giết stack worktree khác đang chạy; `docker ps` trước.)

### 12. `assignment_failed` là system-owned

- **Triệu chứng**: re-assign task sau saga fail mà badge "Gán thất bại" không biến mất.
- **Nguyên nhân**: status fail do system quản — re-assign đơn thuần không tự reset.
- **Xử lý**: PATCH tường minh `{assigneeId, status: "todo"}` (status writable: `todo/in_progress/done`).

### 13. Đường mạng: inter-service qua tên compose, .env không commit

- **Triệu chứng**: service gọi nhau được lúc dev native, chết trong compose (hoặc ngược lại); secret lộ.
- **Nguyên nhân**: dùng `localhost` giữa các service; `.env` bị add nhầm.
- **Xử lý**: inter-service luôn `http://node-svc:3001` kiểu tên compose; browser/FE chỉ chạm gateway :8080. `.env` không bao giờ commit — mẫu trong `platform/.env.example`.

### 14. Sửa port = 4 chỗ cùng commit

- **Triệu chứng**: đổi port 1 chỗ, chỗ khác vẫn cũ — gateway route sai, e2e đỏ.
- **Xử lý**: cùng một commit sửa đủ: `platform/conventions/05-ports.md` + `.env.example` + `docker-compose.yml` + README.

## Where-is-what — việc X → file Y

| Khi cần… | Đọc / sửa |
|---|---|
| Sửa API/contract (endpoint, field, schema, event) | `contracts/openapi/*.yaml` · `contracts/db/tasks-schema.sql` · `contracts/events/task-events.md` (+ fixtures golden) — skill `sync-contracts` khi đổi; node codegen `pnpm --filter node-svc generate:types`; snapshot go-svc `internal/api/openapi/` phải bit-identical (CI drift-guard) |
| Thêm service mới | skill `add-service` (`.claude/skills/`) — thủ tục 4 SF + lệnh verify; conventions 01–09 |
| Đụng Kafka / outbox / saga / DLQ | `platform/conventions/09` + `docs/adr/0008` + `contracts/events/task-events.md` |
| FE / Module Federation / design system | `docs/adr/0002` + `docs/adr/0009` + `app/ui-kit/README.md` + `app/shared/README.md`; recipes ở [recipes.md](recipes.md); **read-locked** `app/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts` — cấm sửa ngoài epic được duyệt; nâng cấp react/rspack/MF phải re-spike qua `app/spike` |
| Tokens / theme / màu | `app/ui-kit` (tokens + `UiKitProvider` + themes/dark.css) — rules tokens-only ở Phần II AGENTS.md |
| Tổ chức epic / story với Wakii | `docs/wakii-playbook.md` (4 archetype chia SF + gates) |
| Chạy demo / e2e / debug stack | `run.compose` trong `orca.yaml` · `scripts/smoke/e2e.sh` · `docs/walkthrough.md` · agent `e2e-runner` |
| Scaffold project mới từ boilerplate | `bash scripts/scaffold/scaffold.sh <tên>` · package `create-wakii-stack` (npx) |
| Mở PR / merge / branch / commit | `docs/git-flow.md` + template `.github/pull_request_template.md` |
| Ports / config / healthcheck / logging / CORS / Dockerfile | `platform/conventions/01–09` (05 = ports) |
| Vì sao kiến trúc vậy | `docs/adr/0001–0010` |
| Agent miền + skills AI | `.claude/agents/` (fe-dev · be-dev · e2e-runner · contracts-keeper) · `.claude/skills/` |
| Onboard người mới / chạy lần đầu | `docs/walkthrough.md` + `docs/toolchain.md` |
