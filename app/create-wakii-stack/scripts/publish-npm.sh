#!/usr/bin/env bash
# ============================================================================
# Publish create-wakii-stack lên npmjs.org — bundle app/stack-template VÀO
# package tại <pkg>/stack-template. Path ĐÚNG CHỖ engine resolve khi npm:
# src/scaffold.ts DEFAULT_TEMPLATE_ROOT = resolve(dist dir, '../../stack-template')
# → từ <pkg>/dist/index.js ra <pkg>/stack-template (npm files không nhận path
# cha '../' — bundle vào package là bắt buộc, mirror starter-templates của
# create-wakii-app). Auth: env NPM_TOKEN (ưu tiên) hoặc ~/.npmrc đã có token wakii.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

NPMRC_AUTH="$(grep -s '^//registry\.npmjs\.org/:_authToken=' "${NPM_CONFIG_USERCONFIG:-$HOME/.npmrc}" | head -1 || true)"
if [ -z "${NPM_TOKEN:-}" ] && [ -z "$NPMRC_AUTH" ]; then
  echo "✗ Thiếu NPM_TOKEN (env) hoặc _authToken npmjs trong ~/.npmrc"; exit 1
fi

echo "▶ Build (tsup)..."
pnpm build

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp -r dist README.md package.json "$TMP/"

# Bundle stack-template — đường dẫn SIBLING ../stack-template (= <repo>/app/stack-template,
# cùng kiều ../starter-templates của create-wakii-app). rsync cho exclude .DS_Store.
# Guard 2 file sống còn: engine load stack-manifest.json ngay khi scaffold; template
# thiếu package.json là scaffold ra app hỏng. Thiếu → chạy scripts/snapshot-stack-template.sh --force.
rsync -a --exclude='.DS_Store' ../stack-template/ "$TMP/stack-template/"
# README embeds the animated output SVG — npm readers can't fetch relative
# paths or raw.githubusercontent (private repo) → serve from the tarball via unpkg.
mkdir -p "$TMP/docs/assets/readme"
cp ../../docs/assets/readme/stack-output.svg "$TMP/docs/assets/readme/"
[ -f "$TMP/stack-template/stack-manifest.json" ] || { echo "✗ thiếu stack-manifest.json sau copy — chạy scripts/snapshot-stack-template.sh --force"; exit 1; }
[ -f "$TMP/stack-template/package.json" ] || { echo "✗ thiếu stack-template/package.json sau copy"; exit 1; }

# Strip phần KHÔNG publish: devDeps (tooling) + scripts + private. GIỮ NGUYÊN
# dependencies (@clack/prompts + yaml — yaml là runtime dep của manifest loader)
# và bin. files field khai báo đúng 3 thứ engine cần: dist + stack-template + README.
python3 - "$TMP" << 'PY'
import json, sys
p = json.load(open(f'{sys.argv[1]}/package.json'))
p['publishConfig'] = {'registry': 'https://registry.npmjs.org', 'access': 'public'}
p['files'] = ['dist', 'stack-template', 'README.md', 'docs/assets/readme/stack-output.svg']
for k in ('devDependencies', 'scripts', 'private'): p.pop(k, None)
json.dump(p, open(f'{sys.argv[1]}/package.json', 'w'), indent=2, ensure_ascii=False)
open(f'{sys.argv[1]}/package.json', 'a').write('\n')
PY

if [ -n "${NPM_TOKEN:-}" ]; then
  printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$TMP/.npmrc"
fi
cd "$TMP"
npm publish --registry=https://registry.npmjs.org --access public
echo "✓ create-wakii-stack published (npmjs.org)"
