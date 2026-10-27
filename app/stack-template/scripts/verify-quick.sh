#!/usr/bin/env bash
# ============================================================================
# verify-quick.sh — vòng kiểm nhanh (~2 phút) theo PHẠM VI THAY ĐỔI.
# Contract output DÀNH CHO AI:
#   default : text 1 dòng/bước — "PASS <giây> <step>" / "FAIL <giây> <step> (exit N)"
#             + SUMMARY cuối. Grep được, không banner trang trí.
#   --json  : JSON là contract chính — stdout = MẢNH JSON thuần:
#             [{"step":"...","status":"pass|fail","duration":<giây>}, ...]
#             (progress + log lỗi → stderr). Exit code: 0 all-pass, 1 ≥1 fail,
#             2 lỗi môi trường.
#
# Phạm vi phát hiện (file đổi so với origin/main — kể cả CHƯA commit):
#   app/ui-kit/**            → ui-kit typecheck + test --changed (vitest related;
#                              đổi package.json/vitest config → chạy full suite)
#   app/shell|remotes/**     → typecheck + test + build app đó (rspack)
#   app/admin/**             → typecheck + test
#   app/create-wakii-*/**    → typecheck + test (scaffold tool)
#   services/node-svc|auth-svc/{src,package.json} → test service đó (vitest)
#   services/go-svc/**       → go test ./... (rẻ, có cache — kể cả README)
#   services/spring-svc/{src,pom.xml} → ./mvnw test
#   contracts/**             → spectral lint (pnpm lint:contracts)
#   không diff / file ngoài các scope trên (docs, app/shared, scripts, …)
#                            → FALLBACK: mọi FE typecheck + create-wakii-stack test
#
# Base so diff: env VERIFY_QUICK_BASE (mặc định origin/main).
#
# Lưu ý đúng đắn:
#   • Exit code THẬT — mỗi bước chạy redirect vào log, không qua pipe (bẫy
#     `cmd | tail` nuốt exit-code — AGENTS.md §4).
#   • `touch` file đã track KHÔNG đổi nội dung → git không thấy (chỉ đổi mtime);
#     tạo/sửa file (kể cả chưa track) → thấy ngay.
#   • node-svc/auth-svc: `pnpm install --frozen-lockfile --ignore-workspace`
#     trong thư mục service trước khi test lần đầu (standalone lockfile).
# ============================================================================
set -euo pipefail

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    *) echo "unknown arg: $arg (hỗ trợ: --json)" >&2; exit 2 ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "✗ verify-quick phải chạy bên trong git repo" >&2
  exit 2
}
cd "$ROOT"

BASE="${VERIFY_QUICK_BASE:-origin/main}"
if ! git rev-parse --verify --quiet "$BASE" >/dev/null 2>&1; then
  echo "⚠ không thấy ref '$BASE' (chưa fetch?) — so với HEAD thay thế" >&2
  BASE="HEAD"
fi

# ---------------------------------------------------------------------------
# 1. Tập file thay đổi = diff đã commit (BASE...HEAD) ∪ working tree ∪ untracked
# ---------------------------------------------------------------------------
changed="$( {
  git diff --name-only "$BASE...HEAD" 2>/dev/null || true
  git diff --name-only HEAD || true
  git ls-files --others --exclude-standard
} | sort -u )"

# ---------------------------------------------------------------------------
# 2. Map file → scope
# ---------------------------------------------------------------------------
scope_ui_kit=0; scope_shell=0; scope_tasks=0; scope_activity=0; scope_admin=0
scope_cwapp=0; scope_cwstack=0; scope_go=0; scope_spring=0; scope_contracts=0
svc_node=0; svc_auth=0
unknown=0
unknown_files=""

while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in
    app/ui-kit/*)             scope_ui_kit=1 ;;
    app/shell/*)              scope_shell=1 ;;
    app/remotes/tasks/*)      scope_tasks=1 ;;
    app/remotes/activity/*)   scope_activity=1 ;;
    app/admin/*)              scope_admin=1 ;;
    app/create-wakii-app/*)   scope_cwapp=1 ;;
    app/create-wakii-stack/*) scope_cwstack=1 ;;
    services/node-svc/src/* | services/node-svc/package.json) svc_node=1 ;;
    services/auth-svc/src/* | services/auth-svc/package.json) svc_auth=1 ;;
    services/go-svc/*)        scope_go=1 ;;
    services/spring-svc/src/* | services/spring-svc/pom.xml) scope_spring=1 ;;
    contracts/*)              scope_contracts=1 ;;
    *) unknown=1; unknown_files="$unknown_files $f" ;;
  esac
done <<EOF
$changed
EOF

# ---------------------------------------------------------------------------
# 3. Lập danh sách bước theo scope (KHÔNG có pipe trong cmd — giữ exit code)
# ---------------------------------------------------------------------------
labels=(); cmds=()
add() { labels+=("$1"); cmds+=("$2"); }

if [ "$scope_ui_kit" -eq 1 ]; then
  add "ui-kit typecheck"      "pnpm --filter @wakii/ui-kit typecheck"
  add "ui-kit test --changed" "pnpm --filter @wakii/ui-kit test -- --changed $BASE --passWithNoTests"
fi
if [ "$scope_shell" -eq 1 ]; then
  add "shell typecheck" "pnpm --filter @wakii/shell typecheck"
  add "shell test"      "pnpm --filter @wakii/shell test"
  add "shell build"     "pnpm --filter @wakii/shell build"
fi
if [ "$scope_tasks" -eq 1 ]; then
  add "remote-tasks typecheck" "pnpm --filter @wakii/remote-tasks typecheck"
  add "remote-tasks test"      "pnpm --filter @wakii/remote-tasks test"
  add "remote-tasks build"     "pnpm --filter @wakii/remote-tasks build"
fi
if [ "$scope_activity" -eq 1 ]; then
  add "remote-activity typecheck" "pnpm --filter @wakii/remote-activity typecheck"
  add "remote-activity test"      "pnpm --filter @wakii/remote-activity test"
  add "remote-activity build"     "pnpm --filter @wakii/remote-activity build"
fi
if [ "$scope_admin" -eq 1 ]; then
  add "admin typecheck" "pnpm --filter admin typecheck"
  add "admin test"      "pnpm --filter admin test"
fi
if [ "$scope_cwapp" -eq 1 ]; then
  add "create-wakii-app typecheck" "pnpm --filter create-wakii-app typecheck"
  add "create-wakii-app test"      "pnpm --filter create-wakii-app test"
fi
if [ "$scope_cwstack" -eq 1 ]; then
  add "create-wakii-stack typecheck" "pnpm --filter create-wakii-stack typecheck"
  add "create-wakii-stack test"      "pnpm --filter create-wakii-stack test"
fi
if [ "$svc_node" -eq 1 ]; then
  add "node-svc test" "pnpm --filter node-svc test"
fi
if [ "$svc_auth" -eq 1 ]; then
  add "auth-svc test" "pnpm --filter auth-svc test"
fi
if [ "$scope_go" -eq 1 ]; then
  add "go-svc test" "cd services/go-svc && go test ./..."
fi
if [ "$scope_spring" -eq 1 ]; then
  add "spring-svc test" "cd services/spring-svc && ./mvnw -q test"
fi
if [ "$scope_contracts" -eq 1 ]; then
  add "contracts spectral" "pnpm run lint:contracts"
fi

# FALLBACK — không diff, hoặc có file ngoài mọi scope (docs/shared/scripts/…):
# mọi FE typecheck + create-wakii-stack test. Bỏ pkg đã có scope riêng ở trên.
if [ "$unknown" -eq 1 ] || [ -z "$changed" ]; then
  [ "$scope_ui_kit"   -eq 0 ] && add "ui-kit typecheck (fallback)"         "pnpm --filter @wakii/ui-kit typecheck"
  [ "$scope_shell"    -eq 0 ] && add "shell typecheck (fallback)"          "pnpm --filter @wakii/shell typecheck"
  [ "$scope_tasks"    -eq 0 ] && add "remote-tasks typecheck (fallback)"   "pnpm --filter @wakii/remote-tasks typecheck"
  [ "$scope_activity" -eq 0 ] && add "remote-activity typecheck (fallback)" "pnpm --filter @wakii/remote-activity typecheck"
  [ "$scope_admin"    -eq 0 ] && add "admin typecheck (fallback)"          "pnpm --filter admin typecheck"
  [ "$scope_cwstack"  -eq 0 ] && add "create-wakii-stack test (fallback)"  "pnpm --filter create-wakii-stack test"
fi

total=${#labels[@]}
if [ "$total" -eq 0 ]; then
  echo "verify:quick: không phát hiện thay đổi so với $BASE — nothing to do"
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Header phạm vi (text mode: stdout; JSON mode: stderr — giữ stdout thuần)
# ---------------------------------------------------------------------------
n_files=$(printf '%s\n' "$changed" | grep -c . || true)
apps=""
[ "$scope_ui_kit" -eq 1 ]    && apps="$apps ui-kit"
[ "$scope_shell" -eq 1 ]     && apps="$apps shell"
[ "$scope_tasks" -eq 1 ]     && apps="$apps remote-tasks"
[ "$scope_activity" -eq 1 ]  && apps="$apps remote-activity"
[ "$scope_admin" -eq 1 ]     && apps="$apps admin"
[ "$scope_cwapp" -eq 1 ]     && apps="$apps create-wakii-app"
[ "$scope_cwstack" -eq 1 ]   && apps="$apps create-wakii-stack"
svcs=""
[ "$svc_node" -eq 1 ] && svcs="$svcs node-svc"
[ "$svc_auth" -eq 1 ] && svcs="$svcs auth-svc"
[ "$scope_go" -eq 1 ] && svcs="$svcs go-svc"
[ "$scope_spring" -eq 1 ] && svcs="$svcs spring-svc"
fb="no"
[ "$unknown" -eq 1 ] || [ -z "$changed" ] && fb="yes"
hdr_scope="base=$BASE files=$n_files apps=[${apps# }] services=[${svcs# }] contracts=$scope_contracts fallback=$fb"
if [ "$unknown" -eq 1 ]; then
  n_unknown=$(printf '%s\n' $unknown_files | wc -l | tr -d ' ')
  hdr_scope="$hdr_scope unknown_files=$n_unknown (vd:$(echo "$unknown_files" | cut -d' ' -f2-4 | cut -c1-100))"
fi
if [ "$JSON" -eq 1 ]; then
  echo "scope: $hdr_scope" >&2
else
  echo "verify:quick $hdr_scope"
fi

# ---------------------------------------------------------------------------
# 5. Chạy tuần tự — mỗi bước 1 dòng; fail thì in 30 dòng cuối log (stderr)
# ---------------------------------------------------------------------------
logdir="$(mktemp -d /tmp/verify-quick.XXXXXX)"
pass=0; fail=0; idx=0
json_rows=""
for cmd in "${cmds[@]}"; do
  label="${labels[$idx]}"
  if [ "$JSON" -eq 0 ]; then
    printf '%-36s ' "$label"
  fi
  t0=$(date +%s)
  rc=0
  bash -c "$cmd" >"$logdir/$idx.log" 2>&1 || rc=$?
  dur=$(( $(date +%s) - t0 ))
  if [ "$rc" -eq 0 ]; then
    status="pass"
    pass=$((pass + 1))
    if [ "$JSON" -eq 1 ]; then
      echo "pass ${dur}s $label" >&2
    else
      echo "PASS ${dur}s"
    fi
  else
    status="fail"
    fail=$((fail + 1))
    if [ "$JSON" -eq 1 ]; then
      echo "FAIL ${dur}s $label (exit $rc) log=$logdir/$idx.log" >&2
    else
      echo "FAIL ${dur}s (exit $rc) log=$logdir/$idx.log"
    fi
    {
      echo "─── 30 dòng cuối: $label ───"
      tail -n 30 "$logdir/$idx.log"
    } >&2
  fi
  json_rows="$json_rows{\"step\": \"$label\", \"status\": \"$status\", \"duration\": $dur}, "
  idx=$((idx + 1))
done

total_secs=$SECONDS
json_rows="${json_rows%, }"
if [ "$JSON" -eq 1 ]; then
  echo "SUMMARY pass=$pass fail=$fail total=${total_secs}s log=$logdir" >&2
  echo "[$json_rows]"
else
  echo "SUMMARY pass=$pass fail=$fail total=${total_secs}s log=$logdir"
fi
[ "$fail" -eq 0 ] && exit 0
exit 1
