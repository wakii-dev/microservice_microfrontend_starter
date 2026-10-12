#!/usr/bin/env bash
# ============================================================================
# e2e smoke — SF-7 (FI-75): chứng minh chuỗi 3 service LIỀN MẠCH qua gateway.
#
# login (auth-mock) → tạo task (node-svc, assignee validate qua spring-svc)
#   → đọc feed + stats (go-svc, event push fire-and-forget từ node-svc).
#
# API-level thuần curl — chạy được mọi nơi có bash + curl (GitHub CI, Git Bash
# Windows, Linux). Browser walkthrough KHÔNG nằm ở đây (human gate tại
# checkpoint — xem docs/walkthrough.md).
#
# Env:
#   GATEWAY_URL        (default http://localhost:8080)
#   SMOKE_EMAIL        (default alice@demo.local)
#   SMOKE_PASSWORD     (default demo-password)
#   SMOKE_ASSIGNEE_ID  (default RỖNG — context pack sf-7 chỉ yêu cầu chain
#                      login→task→feed. Set UUID bob để thêm assert validate
#                      assignee qua spring-svc; hiện đang FAIL vì BUG spring-svc
#                      double-prefix /api/users/users — đã report coordinator.)
#   SMOKE_TITLE_PREFIX (default smoke)
#   SMOKE_FEED_RETRIES (default 10 — node push fire-and-forget + go persist async)
#
# Exit 0 = PASS; exit N = fail ở bước N (in rõ bước fail).
# ============================================================================
set -u

GW="${GATEWAY_URL:-http://localhost:8080}"
EMAIL="${SMOKE_EMAIL:-alice@demo.local}"
PASSWORD="${SMOKE_PASSWORD:-demo-password}"
ASSIGNEE="${SMOKE_ASSIGNEE_ID:-}" # opt-in — xem note env ở header
PREFIX="${SMOKE_TITLE_PREFIX:-smoke}"
RETRIES="${SMOKE_FEED_RETRIES:-10}"
TITLE="$PREFIX-$(date +%s)-$$"

say() { echo "[smoke] $*"; }
fail() { echo "[smoke] FAIL bước $1: $*" >&2; exit "$1"; }
extract() { # extract <json-field> <body-file> — grep thuần, không jq
  sed -E "s/.*\"$1\"[: ]*\"?([^\",}]+)\"?.*/\1/;t;d" "$2" | head -1
}
CURL="curl -s --max-time 5" # timeout cụ thể — hung curl = treo CI tới 6h (P1 code-review SF-7)

command -v curl >/dev/null || fail 1 "curl không có trong PATH"

# dọn temp files (chứa token/body) kể cả khi fail giữa chừng (P2 security-audit SF-7)
trap 'rm -f "$LOGIN_BODY" "$STATS_BEFORE" "$TASK_BODY" "$FEED_BODY" "$STATS_AFTER"' EXIT 2>/dev/null || true

# --- Bước 1: gateway + auth-mock ready (poll — gateway không có /readyz riêng,
#            conventions/02 rule 3; /api/auth/readyz = auth-mock qua gateway) ---
READY=0
for _ in $(seq 1 30); do
  if curl -sf --max-time 3 "$GW/api/auth/readyz" 2>/dev/null | grep -q '"status":"ok"'; then READY=1; break; fi
  sleep 1
done
[ "$READY" = "1" ] || fail 2 "gateway/auth-mock chưa ready sau 30s ($GW/api/auth/readyz)"
say "1/5 gateway + auth-mock ready"

# --- Bước 2: login → accessToken ---
LOGIN_BODY="$(mktemp)"
HTTP=$($CURL -o "$LOGIN_BODY" -w '%{http_code}' -X POST "$GW/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
[ "$HTTP" = "200" ] || fail 3 "login HTTP $HTTP (expect 200): $(cat "$LOGIN_BODY")"
TOKEN="$(extract accessToken "$LOGIN_BODY")"
# không in body login (chứa token) — chỉ báo shape field (P2 security-audit SF-7)
[ -n "$TOKEN" ] && [ "${#TOKEN}" -gt 40 ] || fail 3 "login 200 nhưng thiếu accessToken hợp lệ (field accessToken không parse được — kiểm shape LoginResponse contract)"
say "2/5 login OK (token ${#TOKEN} chars)"

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
say "3/5 stats baseline totalTasks=$BASELINE"

# --- Bước 4: tạo task (node-svc; assignee opt-in → node validate qua spring-svc) ---
TASK_BODY="$(mktemp)"
PAYLOAD="{\"title\":\"$TITLE\",\"description\":\"SF-7 e2e smoke\"}"
[ -n "$ASSIGNEE" ] && PAYLOAD="{\"title\":\"$TITLE\",\"description\":\"SF-7 e2e smoke\",\"assigneeId\":\"$ASSIGNEE\"}"
HTTP=$($CURL -o "$TASK_BODY" -w '%{http_code}' -X POST "$GW/api/tasks" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "$PAYLOAD")
[ "$HTTP" = "201" ] || fail 5 "tạo task HTTP $HTTP (expect 201): $(cat "$TASK_BODY")"
TASK_ID="$(extract id "$TASK_BODY")"
[ -n "$TASK_ID" ] || fail 5 "task id không parse được: $(cat "$TASK_BODY")"
say "4/5 task tạo OK id=$TASK_ID title=$TITLE"

# --- Bước 5: feed phản ánh (go-svc; node push fire-and-forget + go persist
#            async → poll RETRIES×1s, không assert ngay — flaky nếu assert ngay) ---
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
[ "$FOUND" = "1" ] || fail 6 "feed không thấy action=task.created + taskTitle=$TITLE sau ${RETRIES}s retry"
say "5a/5 feed có task.created + taskTitle=$TITLE"

# --- stats tăng (go-svc đọc readonly schema tasks — exit criterion readonly) ---
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
say "5b/5 stats totalTasks: $BASELINE → $AFTER"

say "PASS — chuỗi auth-mock → node-svc (validate spring-svc) → go-svc liền mạch qua gateway $GW"
