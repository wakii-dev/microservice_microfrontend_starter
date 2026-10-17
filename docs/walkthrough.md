# Fresh-clone walkthrough — từ clone đến demo chạy được

Checklist cho người MỚI copy boilerplate. Mọi lệnh dưới đây là những gì đã chạy thật trong CI (evidence: `docs/superpowers/evidence/sf-5-convergence/test-run.txt` — convergence 10 services + e2e 2 chiều; các SF trước: `evidence/sf-*/`).

## 0. Toolchain cần có

Đọc [toolchain.md](toolchain.md). Tóm tắt: Node 22 + pnpm 9 (corepack) + JDK 21 + Go 1.24 + bash/curl. Docker TÙY CHỌN (không có vẫn xong được — chọn đường A hoặc B bên dưới). LƯU Ý: saga demo (mục 4b) + DLQ cần Kafka → đường A (compose); đường B chỉ chạy happy path (`SMOKE_SAGA=0`).

## 1. Clone + cài đặt

```bash
git clone <repo> && cd <repo>
pnpm install --frozen-lockfile     # FE workspace (app/*)
cd services/node-svc && pnpm install --frozen-lockfile --ignore-workspace && cd ../..   # node-svc standalone lockfile
cd services/auth-svc && pnpm install --frozen-lockfile --ignore-workspace && cd ../..   # auth-svc standalone lockfile
```

## 2. Postgres + seed

Cần Postgres 16 chạy sẵn với init script của platform (schemas + roles + readonly grants):

- **Có Docker (dễ nhất):** `cd platform && cp .env.example .env` (điền mật khẩu) → `docker compose up -d postgres` — init script `platform/postgres/init/01-init.sh` tự chạy lần đầu.
- **Không Docker:** cài/portable Postgres 16, `initdb` một data dir rồi chạy nội dung `platform/postgres/init/01-init.sh` tay (tạo db `boilerplate`, roles `node_svc`/`spring_svc`/`go_svc`/`go_readonly`/`auth_svc` với mật khẩu khớp .env, schemas + default privileges).

## 3. Chọn đường chạy demo

### Đường A — Compose (có Docker — khuyến nghị)

```bash
cd platform
cp .env.example .env                # điền JWT_SECRET (openssl rand -base64 48) + passwords
docker compose down -v              # ⚠️ CHẠY 1 LẦN sau pull nếu máy có pgdata volume TỪ bản cũ:
                                    #    (1) Flyway V2 seed user svc-fail/svc-activity + (2) init script tạo
                                    #    schema `auth` + role `auth_svc` (auth-real SF-5) CHỈ chạy lúc volume
                                    #    MỚI — volume cũ thiếu → saga chết ở auth/validate, auth-svc chết ở
                                    #    DATABASE auth (healthcheck /readyz đỏ, gateway không lên được).
                                    # ⚠️ `.env` tạo từ bản cũ: thêm `AUTH_SVC_DB_PASSWORD` (cp từ .env.example).
# Kafka KHÔNG có data volume — topics mất sau mỗi `down` → tạo tường minh
# TRƯỚC khi boot services (giống CI convergence.yml; tránh 2 race: go consumer
# kẹt empty-assignment khi subscribe trước topic + DLQ publish Unknown Topic):
docker compose up -d postgres kafka
until docker compose exec -T kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 >/dev/null 2>&1; do sleep 2; done
for topic in task-events task-events.dlq; do
  docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
    --create --if-not-exists --topic "$topic" --partitions 1 --replication-factor 1
done
docker compose up -d --build        # health-gated chain tự đợi đúng thứ tự (10 services, kafka lazy-connect)
bash ../scripts/smoke/e2e.sh        # từ platform/ — script ở repo root. PASS = 15 bước, 3 luồng:
                                    #   happy     : login→task→feed QUA KAFKA (outbox → topic → go consumer)
                                    #   auth-real : register→refresh rotation→reuse→401→logout + RBAC (user DELETE 403, alice 204)
                                    #   saga      : assign svc-fail → task assignment_failed + event gốc ở task-events.dlq
# Mở browser: http://localhost:8080/ → login alice@demo.local / demo-password
#             (hoặc tự register account mới — tab Register, mục 4a)
```

### Đường B — Native (không Docker — từng service một)

```bash
# 4 service BE — mỗi lệnh 1 terminal, env theo .env.example (placeholder dev):
cd services/auth-svc && JWT_SECRET=<dev-secret> PORT=8090 \
  DATABASE_URL="postgres://auth_svc:<pw>@localhost:5432/boilerplate" \
  USERS_FIXTURE_PATH=$(pwd)/../../contracts/auth/users.json \
  AUTH_DEV_PASSWORD=demo-password pnpm dev

cd services/spring-svc && SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/boilerplate" \
  SPRING_DATASOURCE_USERNAME=spring_svc SPRING_DATASOURCE_PASSWORD=<pw> \
  JWT_SECRET=<dev-secret> SERVER_PORT=8081 USERS_FIXTURE_PATH=$(pwd)/../../contracts/auth/users.json \
  ./mvnw spring-boot:run        # Windows: ./mvnw.cmd

cd services/node-svc && JWT_SECRET=<dev-secret> PORT=3001 \
  DATABASE_URL="postgres://node_svc:<pw>@localhost:5432/boilerplate" \
  SPRING_SVC_URL=http://localhost:8081 GO_SVC_URL=http://localhost:8082 pnpm dev

cd services/go-svc && JWT_SECRET=<dev-secret> PORT=8082 \
  DATABASE_URL="postgres://go_svc:<pw>@localhost:5432/boilerplate" \
  DATABASE_READONLY_URL="postgres://<owner-user>:<owner-pw>@localhost:5432/boilerplate" \
  SPRING_SVC_URL=http://localhost:8081 go run ./cmd/server

# FE (3 terminal):
cd app/shell   && pnpm dev   # :3000
cd app/remotes/tasks    && pnpm dev   # :4001
cd app/remotes/activity && pnpm dev   # :4002
```

Native mode KHÔNG có nginx gateway — FE gọi thẳng service port theo conventions/07 (CORS dev đã mở). Chain 3 service "qua một cổng" là đặc tính của compose mode (đường A) + CI e2e-smoke job.

### Verify chain bằng smoke script (cả hai đường)

Script gọi qua prefix `/api/<svc>` (giống gateway routing — conventions/08):
- Đường A (từ repo root, không cd platform): `bash scripts/smoke/e2e.sh` (mặc định `GATEWAY_URL=http://localhost:8080`). Mặc định chạy **2 chiều** — happy + saga kèm DLQ assert (cần docker để exec `kafka-console-consumer` trong container kafka).
- Đường B (native, không Kafka): `SMOKE_SAGA=0 bash scripts/smoke/e2e.sh` — happy + auth-real (bỏ saga + DLQ). Không có gateway thật — chứng minh chain bằng cách gọi service trực tiếp, hoặc dựng proxy mapping `/api/*` (SF-7 dùng mini Node proxy cục bộ khi verify native — KHÔNG commit vì chỉ phục vụ verify).

## 4. Browser walkthrough (human gate — KHÔNG trong CI)

Trên máy có stack sống (đường A hoặc B + FE dev servers). UI theo design direction "Linear-referenced dark" (story VU-53): nền tối `#010102`, 1 accent indigo, badge pill chấm-màu, không box-shadow.

1. Mở `http://localhost:8080/` (đường A) hoặc `http://localhost:3000/` (đường B) → thấy **dashboard chào** với quick links Tasks/Activity + box **TÀI KHOẢN DEMO** (`alice@demo.local / demo-password`, `fail@demo.local`). Login → nav phải hiện user chip (avatar + email) + nút **Đăng xuất**.
2. Nav → **Tasks** (item nav active gạch accent): form **Tạo task** (Tiêu đề + Mô tả) → task mới xuất hiện đầu danh sách, heading **"Danh sách (x/total)"** cập nhật. Thử tiếp:
   - **Sửa inline**: nút *Sửa* trên card → input inline tiêu đề/mô tả → *Lưu* (PATCH thật) / *Huỷ*.
   - **Đổi status**: select trên card (`Cần làm` / `Đang làm` / `Xong`) — lúc PATCH đang bay item hiện spinner + select khoá (per-item busy).
   - **Lọc**: chip `Tất cả` / `Cần làm` / `Đang làm` / `Xong` → danh sách + "x/total" lọc theo `?status=`.
   - **Tải thêm**: nếu total > số đã tải, nút *Tải thêm* cuối danh sách nạp trang kế (limit/offset thật), "x/total" tăng dần tới đủ.
   - **Xoá**: nút *Xoá* → xác nhận inline ("Xoá task này?" → *Xác nhận xoá* / *Huỷ*) — xoá thật qua DELETE.
   - Mỗi card hiển thị assignee (UUID rút gọn monospace, hover thấy đủ), "Chưa gán" nếu trống, + createdAt vi-VN.
3. Nav → **Activity**: **stats cards** (Tổng task / Cần làm / Đang làm / Xong / Sự kiện 24h qua) + **feed timeline nhóm theo ngày** phản ánh mọi thao tác ở bước 2 qua Kafka (outbox → `task-events` → go consumer): badge "đã tạo / đã cập nhật / đã giao / đã xoá" từng màu, tên task, time vi-VN. Nút *Làm mới* load lại.
4. **Remote-down fallback**: dừng 1 remote rồi reload shell — đường A: `docker stop boilerplate-remote-tasks-1`; đường B: Ctrl-C dev server `:4001`. Shell vẫn nguyên (nav + user chip), slot Tasks hiện fallback "Không tải được phần **tasks**…" + nút **Thử lại**; **Activity vẫn chạy bình thường**. Khôi phục: khởi động lại remote (`docker start` / chạy lại `pnpm dev`) rồi nút *Thử lại* tải lại remote; nếu nút chưa ăn (MF runtime giữ rejection cũ) thì **reload trang** — remote sống lại mount bình thường.

### 4a. Auth thật — register / refresh / logout-all 2 tab (epic auth-real)

1. **Register**: mở `http://localhost:8080/` → tab **Register** trên login screen → email mới + password (8–72 ký tự) + tên hiển thị → tạo xong là đăng nhập luôn (roles `["user"]`). Đăng xuất → đăng nhập lại bằng account vừa tạo ✓.
2. **Refresh rotation (2 tab)**: đăng nhập cùng account ở 2 tab. Tab 1 đứng yên đến khi access token hết hạn (30m) — request kế tab 1 tự refresh (rotate) rồi retry, KHÔNG bị văng về login. (Nhạy hơn: `POST /api/auth/refresh` tay bằng refreshToken trong `localStorage['bp.rt']` — response trả cặp mới, token cũ không dùng lại được.)
3. **Logout-all (chuẩn acceptance — 1 tab chết, 1 tab còn)**: tab 2 bấm **Đăng xuất** (chỉ revoke refresh của tab đó — tab 1 VẪN sống vì access token 30m còn hạn). Để chết HẾT tab: gọi logout-all (chưa có nút UI — dùng token của account). P2 security-audit SF-5: đừng dán token thẳng vào lệnh (rơi shell history) — dùng `read -rs`:
   ```bash
   read -rs TOKEN   # dán access token rồi Enter (không echo)
   curl -X POST http://localhost:8080/api/auth/logout-all -H "Authorization: Bearer $TOKEN"
   unset TOKEN
   ```
   Quay lại tab 1, bấm bất kỳ thao tác gọi API kế tiếp → 401 → auto-refresh fail (token bị revoke-all) → về màn login. Đó là hành vi ĐÚNG (không cross-tab realtime — kiểm ở request kế).
4. **RBAC demo**: login `bob@demo.local` / `demo-password` (roles `["user"]`) → tạo task → nút **Xoá** → bị chặn (403 FORBIDDEN — hiện thông báo lỗi, task còn nguyên). Login `alice@demo.local` (roles `["admin"]`) → xoá cùng task → thành công. e2e assert cùng chuỗi (bước 11–12).

### 4b. Saga demo (story FI-76 — cần đường A, có Kafka)

1. Trong **Tasks**, tạo task (vd `saga-demo`) rồi gán cho user fixture fail: **`fail@demo.local`** — UI hiển thị assignee ở chế độ read-only (UUID rút gọn), việc gán đi qua API: `PATCH /api/tasks/{id}` với `assigneeId=55555555-5555-4555-8555-555555555555` (swagger `:8080/api/tasks/docs` hoặc curl với Bearer token).
2. Go consumer cố tình fail ×3 (simulate hook — assignee trùng svc-fail) → publish compensating event `task.assignment_failed` vào topic chung → node compensation consumer cập nhật status.
3. Quan sát trên **Tasks**: task chuyển badge **"Gán thất bại"** (pill đỏ chấm đỏ — nhận diện rõ; task ở trạng thái này không còn select status — system-owned). Event gốc (task.assigned) nằm ở `task-events.dlq`:
   ```bash
   docker compose -f platform/docker-compose.yml --env-file platform/.env.example exec -T kafka \
     /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
     --topic task-events.dlq --from-beginning --timeout-ms 15000
   # mỗi dòng = 1 DLQ message: {"schemaVersion":1,"originalEvent":"{...task.assigned...}","error":{"reason":...,"retries":3,...}}
   ```
4. **Recovery**: re-assign cho user hợp lệ (bob, id `22222222-2222-4222-8222-222222222222`) → saga chạy lại từ đầu (bob ≠ svc-fail, go handler xử lý thường). LƯU Ý: `assignment_failed` là system-owned — re-assign KHÔNG tự reset status (repo `update()` chỉ set field trong patch); muốn đưa task về luồng hiển thị bình thường, PATCH tường minh `{"assigneeId":"<bob-id>","status":"todo"}` (status writable 3 giá trị — `assignment_failed` PATCH cấm). Trên UI task có lại badge "Cần làm" + select status.

> ⚠️ Known issue (đã report coordinator story VU-53, 2026-10-14): standalone debug ở **build prod compose** (`:4001`/`:4002` container) đang treo trang trắng — share-scope init của react-dom tham chiếu chunk không tồn tại trong build output. **Load trong shell (:8080) không ảnh hưởng**; standalone có style chạy đúng trên **dev server** (đường B: `pnpm --filter @wakii/remote-tasks dev` → :4001). Chi tiết: `docs/superpowers/evidence/ui-redesign/` (conv-22/conv-23).

> CI chạy đúng chuỗi này mỗi push: job `convergence/e2e-smoke` — step saga assert status + DLQ bằng `kafka-console-consumer` (không cần browser).

## 5. Copy/scaffold project mới

```bash
bash scripts/scaffold/scaffold.sh my-project
cd my-project
pnpm install --no-frozen-lockfile   # lần đầu non-frozen — xem SCAFFOLD.md
# rồi lặp lại mục 2-4 trong project mới
```

Phát triển tiếp project mới theo story workflow (Wakii): xem [wakii-playbook.md](wakii-playbook.md) — decision tree story/single/fix + 4 archetype chia SF + gates.

## 6. CI báo gì

| Workflow | Chạy khi | Bằng chứng |
|----------|---------|-----------|
| `contracts` | contracts/**, platform/** đổi | spectral + gitleaks + compose config + boot-smoke auth-svc + schemathesis FULL (auth.yaml v2) |
| `services-*` / `shell` / `remotes-*` | thư mục tương ứng đổi | build + test + docker build + boot-smoke (node/go có kafka boot-smoke) |
| `convergence` (SF-5, story FI-76) | mọi push | e2e 2 chiều trên compose 10 services (happy qua Kafka + saga → `assignment_failed` + DLQ assert) + copy-dir standalone + scaffold output build được |
