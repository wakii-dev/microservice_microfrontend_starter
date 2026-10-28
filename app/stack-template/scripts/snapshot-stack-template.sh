#!/usr/bin/env bash
# ============================================================================
# snapshot-stack-template.sh — sinh app/stack-template/ từ repo hiện tại.
# Nguồn template cho create-wakii-stack; engine prune theo stack-manifest.json.
#
# Thiết kế tầng 1 (brief Mission #8):
# - rsync FULL repo trừ build-artifacts + nội bộ team + publish meta KHÔNG thuộc
#   stack sinh ra (.changeset — upstream release tool; publish-uikit.yml — workflow
#   publish package upstream, scaffold không chứa package nào publishable)
#   — template chạy được ngay. LƯU Ý `.git` không có slash: exclude cả FILE lẫn
#   DIR — worktree link (`gitdir: …` file 72 byte) lọt template = scaffold sinh ra
#   sẽ resolve nhầm git repo của máy gốc (R5-fix 2026-10-28, trả giá 1 commit nhầm
#   branch).
# - Placeholder hoá CHỈ chỗ an toàn: root package.json "name" + README H1 +
#   compose `name:` → __STACK_NAME__; wakii-dev trong README + docs hướng dẫn
#   → __STACK_ORG__. KHÔNG sed trong services/ — tên compose service giữ
#   nguyên để `docker compose up` chạy được ngay sau scaffold.
# - Idempotent: khi template đã tồn tại phải chạy --force (xoá cũ, sinh mới).
#   stack-manifest.json được GIỮ qua các lần regen (backup trước xoá, restore
#   sau rsync) — nguồn chân lý prune không bao giờ mất khi refresh template.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

DEST="app/stack-template"
MANIFEST="$DEST/stack-manifest.json"

if [ "${1:-}" != "--force" ] && [ -e "$DEST" ]; then
  echo "✗ $DEST đã tồn tại — chạy lại với --force để xoá và sinh mới"; exit 1
fi

# Giữ manifest qua regen
KEPT=""
if [ -f "$MANIFEST" ]; then
  KEPT="$(mktemp)"
  cp "$MANIFEST" "$KEPT"
fi

[ -e "$DEST" ] && rm -rf "$DEST"
mkdir -p "$DEST"

rsync -a --exclude='go.sum' \
  --exclude='obj/' --exclude='bin/' \
  --exclude='/app/stack-template/' \
  --exclude='/app/create-wakii-app/' \
  --exclude='/app/create-wakii-stack/' \
  --exclude='/.changeset/' \
  --exclude='/.github/workflows/publish-uikit.yml' \
  --exclude='/app/starter-templates/' \
  --exclude='/app/spike/' \
  --exclude='/app/ui-kit/' \
  --exclude='.git' \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='storybook-static/' \
  --exclude='coverage/' \
  --exclude='.vercel/' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='docs/team/' \
  --exclude='docs/superpowers/evidence/' \
  ./ "$DEST/"

# Restore manifest giữ từ lần sinh trước
if [ -n "$KEPT" ]; then cp "$KEPT" "$MANIFEST"; rm -f "$KEPT"; fi

# Placeholder hoá — python chính xác từng chỗ (không sed lan), KHÔNG vào services/
python3 - "$DEST" <<'PY'
import json, pathlib, re, sys

dest = pathlib.Path(sys.argv[1])

# 1) root package.json "name" → __STACK_NAME__
pkg = dest / 'package.json'
data = json.loads(pkg.read_text())
data['name'] = '__STACK_NAME__'
pkg.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

# 2) README.md H1 → __STACK_NAME__ (+ wakii-dev → __STACK_ORG__)
readme = dest / 'README.md'
lines = readme.read_text().split('\n')
if lines and lines[0].startswith('# '):
    lines[0] = '# __STACK_NAME__'
readme.write_text('\n'.join(lines).replace('wakii-dev', '__STACK_ORG__'))

# 3) compose name: → __STACK_NAME__ (chỉ dòng name: — không đụng service blocks)
compose = dest / 'platform' / 'docker-compose.yml'
compose.write_text(compose.read_text().replace('name: boilerplate', 'name: __STACK_NAME__'))

# 4) wakii-dev → __STACK_ORG__ trong docs hướng dẫn (*.md dưới docs/) — CHỈ occurrence
#    trần (org attribution); `wakii-dev/` là BRANCH PREFIX (git-flow.md, WORKFLOW.md,
#    ai/workflow.md) và .husky/pre-push của scaffold enforce đúng prefix này → giữ
#    nguyên (R5 onboarding 2026-10-28: replace mù render docs scaffold thành
#    `wakii/<loại>-<slug>` lệch với rule `wakii-dev/…` của AGENTS.md + husky).
for md in (dest / 'docs').rglob('*.md'):
    text = md.read_text()
    if 'wakii-dev' in text:
        md.write_text(re.sub(r'wakii-dev(?!/)', '__STACK_ORG__', text))
PY

echo "✓ $DEST sinh xong — $(find "$DEST" -type f | wc -l | tr -d ' ') files"
