#!/usr/bin/env bash
# ============================================================================
# e2e smoke — SF-5 (FI-81, story FI-76): chứng minh chuỗi Kafka + Outbox + Saga
# LIỀN MẠCH qua gateway trên compose stack.
#
# 2 chiều (context pack sf-5):
#   HAPPY: login (auth-mock) → tạo task (node-svc; event qua outbox → Kafka →
#          go-svc consume) → đọc feed + stats (go-svc).
#   SAGA : tạo task → PATCH assigneeId = svc-fail fixture → go consumer fail
#          ×3 → compensating event `task.assignment_failed` → node compensation
#          consumer → GET task status = `assignment_failed` → assert DLQ:
#          kafka-console-consumer đọc `task-events.dlq` thấy event gốc.
#
# API-level thuần curl — chạy được mọi nơi có bash + curl (GitHub CI, Git Bash
# Windows, Linux). Bước DLQ cần docker (exec trong container kafka) — tắt cả
# khối saga bằng SMOKE_SAGA=0 (đường B native không Kafka). Browser walkthrough
# KHÔNG nằm ở đây (human gate tại checkpoint — xem docs/walkthrough.md).
#
# Env:
#   GATEWAY_URL        (default http://localhost:8080)
#   SMOKE_EMAIL        (default alice@demo.local)
#   SMOKE_PASSWORD     (default demo-password)
#   SMOKE_SAGA         (default 1 — chạy saga path + DLQ assert; 0 = happy only,
#                      dùng cho môi trường không Kafka/docker — đường B walkthrough)
#   SMOKE_FAIL_USER_ID (default svc-fail fixture UUID — contracts/auth/users.json;
#                      go consumer simulate fail khi assigneeId trùng user này)
#   SMOKE_FEED_RETRIES (default 30 — outbox relay 500ms + Kafka latency; nới từ
#                      10 của SF-7 vì chuỗi giờ qua Kafka thật, CI 10 services
#                      cạnh tranh CPU)
#   SMOKE_SAGA_RETRIES (default 60 — saga: relay + go retry ×3 backoff 500ms +
#                      compensating publish + node compensation UPDATE)
#
# Exit 0 = PASS; exit N = fail ở bước N (in rõ bước fail).
# ============================================================================
set -u

GW="${GATEWAY_URL:-http://localhost:8080}"
EMAIL="${SMOKE_EMAIL:-alice@demo.local}"
PASSWORD="${SMOKE_PASSWORD:-demo-password}"
SAGA="${SMOKE_SAGA:-1}"
FAIL_USER="${SMOKE_FAIL_USER_ID:-55555555-5555-4555-8555-555555555555}"
PREFIX="${SMOKE_TITLE_PREFIX:-smoke}"
RETRIES="${SMOKE_FEED_RETRIES:-30}"
SAGA_RETRIES="${SMOKE_SAGA_RETRIES:-60}"
TITLE="$PREFIX-$(date +%s)-$$"
SAGA_TITLE="$PREFIX-saga-$(date +%s)-$$"

say() { echo "[smoke] $*"; }
fail() { echo "[smoke] FAIL bước $1: $*" >&2; exit "$1"; }
extract() { # extract <json-field> <body-file> — grep thuần, không jq
  sed -E "s/.*\"$1\"[: ]*\"?([^\",}]+)\"?.*/\1/;t;d" "$2" | head -1
}
CURL="curl -s --max-time 5" # timeout cụ thể — hung curl = treo CI tới 6h (P1 code-review SF-7)

command -v curl >/dev/null || fail 1 "curl không có trong PATH"

# dọn temp files (chứa token/body) kể cả khi fail giữa chừng (P2 security-audit SF-7)
# init rỗng TRƯỚC trap — set -u sẽ lỗi unbound khi trap fire trước khi mktemp chạy
LOGIN_BODY=""; STATS_BEFORE=""; TASK_BODY=""; FEED_BODY=""; STATS_AFTER=""
SAGA_TASK_BODY=""; SAGA_GET_BODY=""; DLQ_OUT=""
trap 'rm -f "$LOGIN_BODY" "$STATS_BEFORE" "$TASK_BODY" "$FEED_BODY" "$STATS_AFTER" "$SAGA_TASK_BODY" "$SAGA_GET_BODY" "$DLQ_OUT"' EXIT 2>/dev/null || true

# compose file resolve từ vị trí script — e2e.sh chạy được từ repo root lẫn platform/
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../platform/docker-compose.yml"
COMPOSE_ENV="$SCRIPT_DIR/../platform/.env.example"

# --- Bước 1: gateway + auth-mock ready (poll — gateway không có /readyz riêng,
#            conventions/02 rule 3; /api/auth/readyz = auth-mock qua gateway) ---
READY=0
for _ in $(seq 1 30); do
  if curl -sf --max-time 3 "$GW/api/auth/readyz" 2>/dev/null | grep -q '"status":"ok"'; then READY=1; break; fi
  sleep 1
done
[ "$READY" = "1" ] || fail 2 "gateway/auth-mock chưa ready sau 30s ($GW/api/auth/readyz)"
say "1/8 gateway + auth-mock ready"

# --- Bước 2: login → accessToken ---
LOGIN_BODY="$(mktemp)"
HTTP=$($CURL -o "$LOGIN_BODY" -w '%{http_code}' -X POST "$GW/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
[ "$HTTP" = "200" ] || fail 3 "login HTTP $HTTP (expect 200): $(cat "$LOGIN_BODY")"
TOKEN="$(extract accessToken "$LOGIN_BODY")"
# không in body login (chứa token) — chỉ báo shape field (P2 security-audit SF-7)
[ -n "$TOKEN" ] && [ "${#TOKEN}" -gt 40 ] || fail 3 "login 200 nhưng thiếu accessToken hợp lệ (field accessToken không parse được — kiểm shape LoginResponse contract)"
say "2/8 login OK (token ${#TOKEN} chars)"

# --- Bước 3: baseline stats (go-svc) TRƯỚC khi tạo task — poll: gateway route
#            go-svc service_started → 502 đầu là bình thường, retry KHÔNG abort ---
STATS_BEFORE="$(mktemp)"
GOT=0
for _ in $(seq 1 30); do
  HTTP=$($CURL -o "$STATS_BEFORE" -w '%{http_code}' "$GW/api/activity/stats" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null) || { sleep 1; continue; }
  [ "$HTTP" = "200" ] && { GOT=1; break; }
  sleep 1
done
[ "$GOT" = "1" ] || fail 4 "stats baseline không 200 sau 30 lần retry (go-svc chưa sẵn sàng?) — HTTP cuối $HTTP"
BASELINE="$(extract totalTasks "$STATS_BEFORE")"
case "$BASELINE" in ''|*[!0-9]*) fail 4 "totalTasks baseline không parse được: $(cat "$STATS_BEFORE")";; esac
say "3/8 stats baseline totalTasks=$BASELINE"

# --- Bước 4: tạo task (node-svc; event task.created ghi outbox cùng tx) ---
TASK_BODY="$(mktemp)"
PAYLOAD="{\"title\":\"$TITLE\",\"description\":\"SF-5 e2e happy\"}"
HTTP=$($CURL -o "$TASK_BODY" -w '%{http_code}' -X POST "$GW/api/tasks" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "$PAYLOAD")
[ "$HTTP" = "201" ] || fail 5 "tạo task HTTP $HTTP (expect 201): $(cat "$TASK_BODY")"
TASK_ID="$(extract id "$TASK_BODY")"
[ -n "$TASK_ID" ] || fail 5 "task id không parse được: $(cat "$TASK_BODY")"
say "4/8 task tạo OK id=$TASK_ID title=$TITLE"

# --- Bước 5: feed phản ánh QUA KAFKA (outbox relay 500ms → topic task-events →
#            go consumer → persist; poll RETRIES×1s — nới từ SF-7 vì chuỗi giờ
#            qua Kafka thật: relay 500ms + Kafka latency + consumer lag) ---
FEED_BODY="$(mktemp)"
FOUND=0
for _ in $(seq 1 "$RETRIES"); do
  HTTP=$($CURL -o "$FEED_BODY" -w '%{http_code}' "$GW/api/activity/feed?limit=20" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null) || { sleep 1; continue; }
  # non-200 (vd 502 go-svc chưa bind) → retry, KHÔNG abort (readiness poll)
  if [ "$HTTP" = "200" ] && grep -q '"action":"task.created"' "$FEED_BODY" \
     && grep -q "\"taskTitle\":\"$TITLE\"" "$FEED_BODY"; then
    FOUND=1; break
  fi
  sleep 1
done
[ "$FOUND" = "1" ] || fail 6 "feed không thấy action=task.created + taskTitle=$TITLE sau ${RETRIES}s retry (kiểm: outbox relay chạy? go consumer group go-svc-activity consume?)"
say "5/8 feed có task.created + taskTitle=$TITLE (qua outbox → Kafka → go-svc)"

# --- Bước 5b: stats tăng (go-svc đọc readonly schema tasks — exit criterion readonly) ---
STATS_AFTER="$(mktemp)"
GOT=0
for _ in $(seq 1 30); do
  HTTP=$($CURL -o "$STATS_AFTER" -w '%{http_code}' "$GW/api/activity/stats" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null) || { sleep 1; continue; }
  [ "$HTTP" = "200" ] && { GOT=1; break; }
  sleep 1
done
[ "$GOT" = "1" ] || fail 7 "stats sau không 200 sau 30 lần retry — HTTP cuối $HTTP"
AFTER="$(extract totalTasks "$STATS_AFTER")"
case "$AFTER" in ''|*[!0-9]*) fail 7 "totalTasks sau không parse được: $(cat "$STATS_AFTER")";; esac
[ "$AFTER" -ge $((BASELINE + 1)) ] || fail 7 "stats không tăng: before=$BASELINE after=$AFTER"
say "5b/8 stats totalTasks: $BASELINE → $AFTER"

# ============================================================================
# SAGA PATH (2 chiều — context pack sf-5): assign svc-fail → assignment_failed
# + DLQ assert. SMOKE_SAGA=0 để tắt (môi trường không Kafka/docker — đường B).
# ============================================================================
if [ "$SAGA" = "1" ]; then
  # --- Bước 6: tạo task riêng cho saga + PATCH assigneeId = svc-fail ---
  # (task riêng — taskId unique để assert DLQ không lẫn message khác)
  SAGA_TASK_BODY="$(mktemp)"
  HTTP=$($CURL -o "$SAGA_TASK_BODY" -w '%{http_code}' -X POST "$GW/api/tasks" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d "{\"title\":\"$SAGA_TITLE\",\"description\":\"SF-5 e2e saga\"}")
  [ "$HTTP" = "201" ] || fail 8 "tạo task saga HTTP $HTTP (expect 201): $(cat "$SAGA_TASK_BODY")"
  SAGA_TASK_ID="$(extract id "$SAGA_TASK_BODY")"
  [ -n "$SAGA_TASK_ID" ] || fail 8 "task saga id không parse được: $(cat "$SAGA_TASK_BODY")"
  HTTP=$($CURL -o /dev/null -w '%{http_code}' -X PATCH "$GW/api/tasks/$SAGA_TASK_ID" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d "{\"assigneeId\":\"$FAIL_USER\"}")
  [ "$HTTP" = "200" ] || fail 8 "PATCH assigneeId=$FAIL_USER HTTP $HTTP (expect 200): task $SAGA_TASK_ID"
  say "6/8 saga: PATCH task $SAGA_TASK_ID assigneeId=svc-fail OK — chờ go retry ×3 → compensating"

  # --- Bước 7: poll GET task → status assignment_failed (node compensation
  #            consumer conditional UPDATE; chuỗi: relay 500ms → go consume →
  #            fail ×3 backoff 500ms → publish task.assignment_failed → node
  #            consume → UPDATE — tổng có thể >10s trên CI load) ---
  SAGA_GET_BODY="$(mktemp)"
  GOT=0
  for _ in $(seq 1 "$SAGA_RETRIES"); do
    HTTP=$($CURL -o "$SAGA_GET_BODY" -w '%{http_code}' "$GW/api/tasks/$SAGA_TASK_ID" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null) || { sleep 1; continue; }
    if [ "$HTTP" = "200" ] && grep -q '"status":"assignment_failed"' "$SAGA_GET_BODY"; then
      GOT=1; break
    fi
    sleep 1
  done
  [ "$GOT" = "1" ] || fail 9 "task $SAGA_TASK_ID không thành assignment_failed sau ${SAGA_RETRIES}s (kiểm: go consumer retry/DLQ? node-svc-compensation group consume? conditional UPDATE guard?) — body cuối: $(cat "$SAGA_GET_BODY")"
  say "7/8 saga: task status = assignment_failed (compensation đã chạy)"

  # --- Bước 8: assert DLQ — event gốc (task.assigned cho task saga) phải nằm
  #            ở task-events.dlq. DLQ message shape (producer.go):
  #            {"schemaVersion":1,"originalEvent":"{...\"taskId\":\"<uuid>\"...}",
  #            "error":{...}} — grep taskId đủ chứng minh event gốc present.
  #            2 LỚP (học run 2/3 — cả 2 tool đều đã chứng minh trong CI):
  #            (1) kafka-get-offsets.sh làm arrival gate — end offset > 0 tức
  #                message đã LẤN topic (get-offsets in tức thì, không có quirk
  #                console-consumer thoát ngay trên topic rỗng — run 3 miss vì
  #                DLQ đến 13:08:51.9, poll kết thúc 13:08:51.8);
  #            (2) console-consumer đọc nội dung trên topic ĐÃ có message
  #                (chạy ngay khi có — dump run 3 đọc được message ngay lập tức). ---
  command -v docker >/dev/null || fail 10 "docker không có trong PATH — không assert DLQ được (set SMOKE_SAGA=0 nếu môi trường không có Kafka)"
  DLQ_OUT="$(mktemp)"
  DLQ_ARRIVED=0
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
    DLQ_END="$(docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV" exec -T kafka \
      /opt/kafka/bin/kafka-get-offsets.sh --bootstrap-server localhost:9092 \
      --topic task-events.dlq 2>/dev/null | sed -E 's/.*:([0-9]+)$/\1/')"
    case "$DLQ_END" in ''|*[!0-9]*) DLQ_END=0;; esac
    if [ "$DLQ_END" -ge 1 ]; then DLQ_ARRIVED=1; break; fi
    [ "$attempt" -lt 12 ] && sleep 5
  done
  if [ "$DLQ_ARRIVED" != "1" ]; then
    fail 10 "task-events.dlq end offset vẫn 0 sau 60s — go chưa publish DLQ (kiểm log 'message gốc đưa DLQ' / 'đưa DLQ thất bại' / redelivery loop)"
  fi
  docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV" exec -T kafka \
    /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
    --topic task-events.dlq --from-beginning --timeout-ms 10000 > "$DLQ_OUT" 2>/dev/null
  if grep -q "$SAGA_TASK_ID" "$DLQ_OUT"; then
    say "8/8 DLQ: event gốc của task $SAGA_TASK_ID có mặt ở task-events.dlq (end offset $DLQ_END) — acceptance saga đủ 2 nửa (status + DLQ)"
  else
    fail 10 "DLQ có message (offset $DLQ_END) nhưng không thấy taskId=$SAGA_TASK_ID — dlq output: $(head -c 400 "$DLQ_OUT")"
  fi
else
  say "SMOKE_SAGA=0 — bỏ qua saga path + DLQ assert (chạy happy only)"
fi

say "PASS — chuỗi auth-mock → node-svc (outbox → Kafka) → go-svc liền mạch qua gateway $GW$( [ "$SAGA" = "1" ] && echo ' + saga compensation → assignment_failed → DLQ' )"
