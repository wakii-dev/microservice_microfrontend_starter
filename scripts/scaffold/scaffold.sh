#!/usr/bin/env bash
# ============================================================================
# scaffold.sh — sinh project MỚI từ boilerplate (SF-7, FI-75).
#
# Copy + rename + prune thuần (tar-based — KHÔNG rsync, KHÔNG generator framework,
# đúng spec epic: "copy + rename + prune"). Project mới cùng flow chạy được.
#
# Usage:
#   bash scripts/scaffold/scaffold.sh <new-name> [--out <dir>]
#     <new-name>   tên project mới (lowercase, chữ/số/dấu gạch — dùng làm scope)
#     --out <dir>  thư mục output (default: <cwd>/<new-name>)
#
# Prune (không copy): .git · node_modules · target/ · dist/ · docs/superpowers ·
#   app/spike · .github/workflow-templates · .github/workflows/convergence.yml
#   (pin story branch — chết trong repo mới) · .story-brief.md · .env
#
# Rename: @boilerplate/* → @<new-name>/* (toàn bộ package.json + pnpm-lock.yaml) ·
#   root package name → <new-name> · compose `name:` → <new-name> · README title.
#
# Lưu ý pnpm-lock: importers của thư mục bị prune (vd app/spike) còn sót
# trong lockfile — pnpm tự reconcile ở lần `pnpm install --no-frozen-lockfile`
# ĐẦU TIÊN (bắt buộc — đã ghi trong SCAFFOLD.md output). Không tự strip tay
# bằng sed/awk — rủi ro corrupt lockfile lớn hơn lợi ích.
# ============================================================================
set -euo pipefail

usage() { echo "usage: $0 <new-name> [--out <dir>]" >&2; exit 1; }
[ $# -ge 1 ] || usage
NAME="$1"; shift
[ "${1:-}" = "--out" ] && { OUT="$2"; shift 2; } || OUT=""
[ $# -eq 0 ] || usage

echo "$NAME" | grep -qE '^[a-z0-9][a-z0-9-]*$' || { echo "LỖI: new-name phải lowercase [a-z0-9-]: '$NAME'" >&2; exit 1; }

SRC="$(cd "$(dirname "$0")/../.." && pwd)" # repo root (script ở scripts/scaffold/)
[ -f "$SRC/pnpm-workspace.yaml" ] || { echo "LỖI: không tìm thấy repo root tại $SRC" >&2; exit 1; }
OUT="${OUT:-$PWD/$NAME}"
[ ! -e "$OUT" ] || { echo "LỖI: output đã tồn tại: $OUT" >&2; exit 1; }
# chặn OUT nằm TRONG source (tar copy-into-self ô nhiễm output — P0 code-review SF-7)
# python3 thay realpath -m: BSD realpath (macOS) không có -m — fix portability 2026-10-17
OUT_REAL="$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$OUT")"
case "$OUT_REAL" in "$SRC"/*) echo "LỖI: --out không được nằm trong repo nguồn: $OUT" >&2; exit 1;; esac

# sed -i BSD (macOS) bắt buộc tham số backup ('') — GNU không. Detect 1 lần (fix portability 2026-10-17)
if sed --version >/dev/null 2>&1; then SED_I=(sed -i); else SED_I=(sed -i ''); fi

echo "[scaffold] copy $SRC → $OUT (prune boilerplate-infra)"
mkdir -p "$OUT"
tar -C "$SRC" -cf - \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='*/node_modules' \
  --exclude='*/node_modules/*' \
  --exclude='./*/node_modules' \
  --exclude='*/target' \
  --exclude='*/dist' \
  --exclude='./docs/superpowers' \
  --exclude='./app/spike' \
  --exclude='./.github/workflow-templates' \
  --exclude='./.github/workflows/convergence.yml' \
  --exclude='./.story-brief.md' \
  --exclude='.env' \
  . | tar -C "$OUT" -xf -

echo "[scaffold] rename @boilerplate/* → @$NAME/* (package.json + source imports + Dockerfile + yml + md + lockfile)"
find "$OUT" \( -name package.json -o -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
  -o -name 'Dockerfile*' -o -name '*.yml' -o -name '*.yaml' -o -name '*.md' \) \
  -not -path '*/node_modules/*' -not -path '*/target/*' -not -path '*/dist/*' \
  -exec "${SED_I[@]}" "s/@boilerplate\//@$NAME\//g" {} +
"${SED_I[@]}" "s/@boilerplate\//@$NAME\//g" "$OUT/pnpm-lock.yaml"

echo "[scaffold] rename root package name + compose name + README title + orca.yaml"
"${SED_I[@]}" "s/\"name\": \"[^\"]*\"/\"name\": \"$NAME\"/" "$OUT/package.json"
"${SED_I[@]}" "s/^name: boilerplate/name: $NAME/" "$OUT/platform/docker-compose.yml"
"${SED_I[@]}" "1s/^# Boilerplate Microservice + Micro-app/# $NAME (scaffolded từ boilerplate microservice + micro-frontend)/" "$OUT/README.md"
"${SED_I[@]}" "s/^name: architecture-overview/name: $NAME/" "$OUT/orca.yaml"

cat > "$OUT/SCAFFOLD.md" <<EOF
# Scaffold: $NAME

Sinh từ boilerplate epic FI-62 bởi \`scripts/scaffold/scaffold.sh\` ngày $(date +%F).

## Đổi tên đã áp dụng
- pnpm scope \`@boilerplate/*\` → \`@$NAME/*\` (package.json + pnpm-lock.yaml)
- root package name → \`$NAME\`; compose project name → \`$NAME\`; README title

## Bước tiếp theo (bắt buộc theo thứ tự)
1. \`git init\` + commit đầu tiên.
2. \`pnpm install --no-frozen-lockfile\` — LẦN ĐẦU PHẢI non-frozen: lockfile còn
   giữ importers của thư mục đã prune (app/spike); pnpm tự reconcile.
   Từ lần sau dùng \`--frozen-lockfile\` như thường.
3. \`cp platform/.env.example platform/.env\` rồi điền JWT_SECRET + passwords.
4. Compose (máy có Docker): \`docker compose -f platform/docker-compose.yml --env-file platform/.env up -d --build\`
   → \`bash scripts/smoke/e2e.sh\` (login → tạo task → đọc feed qua gateway :8080).
5. Native (không Docker): theo \`docs/walkthrough.md\`.

## Boundary
- Full e2e trên project scaffolded là **human gate** (cần Docker) — CI chỉ
  chứng minh build + compose-config được (narrowing đã duyệt ở epic FI-62).
- Đọc \`README.md\` + \`docs/walkthrough.md\` + \`docs/adr/\` để hiểu kiến trúc.

## AI onboarding
- \`CLAUDE.md\` — onboarding AI (nguyên tắc vàng + lệnh + gotchas).
- \`orca.yaml\` — descriptor máy đọc cho agent (services/ports/commands/gotchas).
- \`.claude/agents/\` — 4 agent miền: fe-dev · be-dev · e2e-runner · contracts-keeper.
EOF

echo "[scaffold] DONE — project mới tại: $OUT"
echo "[scaffold] tiếp theo: cd '$OUT' && pnpm install --no-frozen-lockfile (xem SCAFFOLD.md)"
