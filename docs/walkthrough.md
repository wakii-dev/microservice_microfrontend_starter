# Fresh-clone walkthrough — từ clone đến demo chạy được

Checklist cho người MỚI copy boilerplate. Mọi lệnh dưới đây là những gì đã chạy thật trong CI (evidence: `docs/superpowers/evidence/sf-5-convergence/test-run.txt` — convergence 10 services + e2e 2 chiều; các SF trước: `evidence/sf-*/`).

## 0. Toolchain cần có

Đọc [toolchain.md](toolchain.md). Tóm tắt: Node 22 + pnpm 9 (corepack) + JDK 21 + Go 1.24 + bash/curl. Docker TÙY CHỌN (không có vẫn xong được — chọn đường A hoặc B bên dưới). LƯU Ý: saga demo (mục 4b) + DLQ cần Kafka → đường A (compose); đường B chỉ chạy happy path (`SMOKE_SAGA=0`).

## 1. Clone + cài đặt

```bash
git clone <repo> && cd <repo>
pnpm install --frozen-lockfile     # FE workspace (frontend/*)
cd services/node-svc && pnpm install --frozen-lockfile --ignore-workspace && cd ../..   # node-svc standalone lockfile
cd platform/auth-mock && pnpm install --ignore-workspace && cd ../..                     # auth-mock standalone
```

## 2. Postgres + seed

Cần Postgres 16 chạy sẵn với init script của platform (schemas + roles + readonly grants):

- **Có Docker (dễ nhất):** `cd platform && cp .env.example .env` (điền mật khẩu) → `docker compose up -d postgres` — init script `platform/postgres/init/01-init.sh` tự chạy lần đầu.
- **Không Docker:** cài/portable Postgres 16, `initdb` một data dir rồi chạy nội dung `platform/postgres/init/01-init.sh` tay (tạo db `boilerplate`, roles `node_svc`/`spring_svc`/`go_svc`/`go_readonly` với mật khẩu khớp .env, schemas + default privileges).

## 3. Chọn đường chạy demo

### Đường A — Compose (có Docker — khuyến nghị)

```bash
cd platform
cp .env.example .env                # điền JWT_SECRET (openssl rand -base64 48) + passwords
docker compose down -v              # ⚠️ CHẠY 1 LẦN sau pull nếu máy có pgdata volume TỪ bản cũ:
                                    #    Flyway V2 seed user svc-fail/svc-activity chỉ chạy lúc volume MỚI —
                                    #    volume cũ thiếu 2 user này → saga demo (mục 4b) chết ở auth/validate.
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
bash ../scripts/smoke/e2e.sh        # từ platform/ — script ở repo root. PASS = 2 chiều:
                                    #   happy: login→task→feed QUA KAFKA (outbox → topic → go consumer)
                                    #   saga : assign svc-fail → task assignment_failed + event gốc ở task-events.dlq
# Mở browser: http://localhost:8080/ → login alice@demo.local / demo-password
```

### Đường B — Native (không Docker — từng service một)

```bash
# 4 service BE — mỗi lệnh 1 terminal, env theo .env.example (placeholder dev):
cd platform/auth-mock && JWT_SECRET=<dev-secret> PORT=8090 \
  USERS_FIXTURE_PATH=$(pwd)/../../contracts/auth/users.json \
  AUTH_MOCK_DEV_PASSWORD=demo-password node src/server.js

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
cd frontend/shell   && pnpm dev   # :3000
cd frontend/remotes/tasks    && pnpm dev   # :4001
cd frontend/remotes/activity && pnpm dev   # :4002
```

Native mode KHÔNG có nginx gateway — FE gọi thẳng service port theo conventions/07 (CORS dev đã mở). Chain 3 service "qua một cổng" là đặc tính của compose mode (đường A) + CI e2e-smoke job.

### Verify chain bằng smoke script (cả hai đường)

Script gọi qua prefix `/api/<svc>` (giống gateway routing — conventions/08):
- Đường A (từ repo root, không cd platform): `bash scripts/smoke/e2e.sh` (mặc định `GATEWAY_URL=http://localhost:8080`). Mặc định chạy **2 chiều** — happy + saga kèm DLQ assert (cần docker để exec `kafka-console-consumer` trong container kafka).
- Đường B (native, không Kafka): `SMOKE_SAGA=0 bash scripts/smoke/e2e.sh` — chỉ happy path. Không có gateway thật — chứng minh chain bằng cách gọi service trực tiếp, hoặc dựng proxy mapping `/api/*` (SF-7 dùng mini Node proxy cục bộ khi verify native — KHÔNG commit vì chỉ phục vụ verify).

## 4. Browser walkthrough (human gate — KHÔNG trong CI)

Trên máy có stack sống (đường A hoặc B + FE dev servers):

1. Mở `http://localhost:8080/` (đường A) hoặc `http://localhost:3000/` (đường B) → login `alice@demo.local` / `demo-password`.
2. Nav → **Tasks**: tạo task mới → hiện trong danh sách (node-svc thật; có assignee thì đi qua spring validate).
3. Nav → **Activity**: feed/stats phản ánh task vừa tạo (outbox → Kafka `task-events` → go consumer).
4. Kill 1 remote dev server → reload shell → error boundary, remote còn lại vẫn chạy.

### 4b. Saga demo (story FI-76 — cần đường A, có Kafka)

1. Trong **Tasks**, tạo task rồi PATCH/assign cho user fixture fail: **`fail@demo.local`** (hoặc gọi `PATCH /api/tasks/{id}` với `assigneeId=55555555-5555-4555-8555-555555555555`).
2. Go consumer cố tình fail ×3 (simulate hook — assignee trùng svc-fail) → publish compensating event `task.assignment_failed` vào topic chung → node compensation consumer cập nhật status.
3. Quan sát: task chuyển sang status **`assignment_failed`** (badge trên remote-tasks — SF-3). Event gốc (task.assigned) nằm ở `task-events.dlq`:
   ```bash
   docker compose -f platform/docker-compose.yml --env-file platform/.env.example exec -T kafka \
     /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
     --topic task-events.dlq --from-beginning --timeout-ms 15000
   # mỗi dòng = 1 DLQ message: {"schemaVersion":1,"originalEvent":"{...task.assigned...}","error":{"reason":...,"retries":3,...}}
   ```
4. Re-assign cho user hợp lệ (bob) → saga chạy lại từ đầu, event flow về bình thường (bob ≠ svc-fail, go handler xử lý thường). LƯU Ý: `assignment_failed` là system-owned — re-assign KHÔNG tự reset status (repo `update()` chỉ set field trong patch); muốn đưa task về luồng hiển thị bình thường, PATCH tường minh `{"assigneeId":"<bob-id>","status":"todo"}` (status writable 3 giá trị — `assignment_failed` PATCH cấm).

> CI chạy đúng chuỗi này mỗi push: job `convergence/e2e-smoke` — step saga assert status + DLQ bằng `kafka-console-consumer` (không cần browser).

## 5. Copy/scaffold project mới

```bash
bash scripts/scaffold/scaffold.sh my-project
cd my-project
pnpm install --no-frozen-lockfile   # lần đầu non-frozen — xem SCAFFOLD.md
# rồi lặp lại mục 2-4 trong project mới
```

## 6. CI báo gì

| Workflow | Chạy khi | Bằng chứng |
|----------|---------|-----------|
| `contracts` | contracts/**, platform/** đổi | spectral + gitleaks + compose config + boot-smoke auth-mock + schemathesis |
| `services-*` / `shell` / `remotes-*` | thư mục tương ứng đổi | build + test + docker build + boot-smoke (node/go có kafka boot-smoke) |
| `convergence` (SF-5, story FI-76) | mọi push | e2e 2 chiều trên compose 10 services (happy qua Kafka + saga → `assignment_failed` + DLQ assert) + copy-dir standalone + scaffold output build được |
