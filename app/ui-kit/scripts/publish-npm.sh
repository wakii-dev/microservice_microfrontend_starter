#!/usr/bin/env bash
# Publish @wakii/ui-kit lên npmjs.org (canonical scope @wakii — KHÔNG đổi name).
# Mirror của publish-github.sh — chỉ đổi đích registry + giữ nguyên tên package.
# Xem RELEASE.md bước 3.
#
# Auth: hoặc env NPM_TOKEN (npm_xxx quyền publish scope @wakii), hoặc đã lưu
# token wakii trong ~/.npmrc (2026-10-24 user duyệt lưu lại — sau đó chạy thẳng
#   ./scripts/publish-npm.sh   không cần env).
set -euo pipefail
cd "$(dirname "$0")/.."

# ============================================================================
# Guard stale-publish (2026-10-29 — chặn tái diễn 2 sự cố publish từ main cũ:
# ui-kit 0.1.9 + cwa 0.2.5). Publish TAY chỉ an toàn khi: tree sạch + đang ở
# main + HEAD == origin/main. CI (GitHub runner set CI=true) bỏ qua guard.
# Luồng CHÍNH THỨC: Actions → workflow `publish-packages`. Vượt có chủ đích
# khi debug cục bộ: bash scripts/publish-npm.sh --force-local
# ============================================================================
if [ "${CI:-}" != "true" ] && [ "${1:-}" != "--force-local" ]; then
  GIT_TERMINAL_PROMPT=0 git fetch origin main --quiet >/dev/null 2>&1 || true
  reasons=""
  [ -z "$(git status --porcelain)" ] || reasons="${reasons}  - git tree đang DIRTY (commit/stash trước khi publish)\n"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  [ "$branch" = "main" ] || reasons="${reasons}  - đang ở nhánh '${branch}', không phải 'main'\n"
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse --verify -q origin/main || echo none)" ]; then
    reasons="${reasons}  - HEAD != origin/main (main local cũ — git fetch + pull trước)\n"
  fi
  if [ -n "$reasons" ]; then
    echo "✗ Publish TAY bị chặn — chỉ publish từ main mới nhất, tree sạch:"
    printf "$reasons"
    echo "  → Đường chính thức: GitHub Actions → publish-packages → Run workflow."
    echo "  → Debug cục bộ có chủ đích: bash scripts/publish-npm.sh --force-local"
    exit 1
  fi
fi

NPMRC_AUTH="$(grep -s '^//registry\.npmjs\.org/:_authToken=' "${NPM_CONFIG_USERCONFIG:-$HOME/.npmrc}" | head -1 || true)"
if [ -z "${NPM_TOKEN:-}" ] && [ -z "$NPMRC_AUTH" ]; then
  echo "✗ Thiếu NPM_TOKEN (env) hoặc _authToken cho registry.npmjs.org trong ~/.npmrc"; exit 1
fi
grep -q '"name": "@wakii/ui-kit"' package.json || { echo "✗ package.json không phải @wakii/ui-kit (sai repo state)"; exit 1; }

echo "▶ Build mới (tsup + CSS compiled)..."
pnpm build

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# Giữ ĐÚNG đường dẫn src/styles trong tarball (files field pack theo src/styles).
# cp nhiều nguồn copy theo BASENAME — 'src/styles' sẽ thành 'styles/' ở gốc và
# npm pack bỏ hết CSS tokens — nên copy tách nguồn, kèm guard.
cp -r dist README.md LICENSE package.json "$TMP/"
mkdir -p "$TMP/src"
cp -r src/styles "$TMP/src/"
[ -d "$TMP/src/styles" ] || { echo "✗ thiếu src/styles sau copy"; exit 1; }
mkdir -p "$TMP/docs"
cp -r docs/assets "$TMP/docs/"
[ -d "$TMP/docs/assets" ] || { echo "✗ thiếu docs/assets sau copy"; exit 1; }

# Giữ NGUYÊN name @wakii/ui-kit (canonical npmjs); registry đích npmjs; bỏ phần
# không cần khi publish (devDeps/scripts/overrides — mirror publish-github.sh).
# QUAN TRỌNG — exports ĐỔI SANG DIST (hotfix 0.4.1): repo exports trỏ TS source
# (ADR-0009 consumed-qua-source cho monorepo) nhưng consumers npm (vite/webpack
# ngoài monorepo) KHÔNG resolve được package entry .ts → build fail. npm package
# nhận dist (js/cjs/d.ts đủ 6 entry) — styles giữ src (css thuần, có trong tarball).
python3 - "$TMP" << 'PY'
import json, sys
p = json.load(open(f'{sys.argv[1]}/package.json'))
p['publishConfig']['registry'] = 'https://registry.npmjs.org'

def dist_entry(name):
    return {
        'types': f'./dist/{name}.d.ts',
        'import': f'./dist/{name}.js',
        'require': f'./dist/{name}.cjs',
    }

p['exports'] = {
    '.': dist_entry('index'),
    './carousel': dist_entry('carousel'),
    './chart': dist_entry('chart'),
    './schedule': dist_entry('schedule'),
    './editor': dist_entry('editor'),
    './experience3d': dist_entry('experience3d'),
    './styles/tokens.css': './src/styles/tokens.css',
    './styles/base.css': './src/styles/base.css',
    './styles/tailwind.css': './src/styles/tailwind.css',
    './styles/themes/dark.css': './src/styles/themes/dark.css',
    './styles/ui-kit.css': './dist/ui-kit.css',
}
p['main'] = './dist/index.cjs'
p['module'] = './dist/index.js'
p['types'] = './dist/index.d.ts'
for k in ('devDependencies', 'scripts', 'overrides'): p.pop(k, None)
json.dump(p, open(f'{sys.argv[1]}/package.json', 'w'), indent=2, ensure_ascii=False)
open(f'{sys.argv[1]}/package.json', 'a').write('\n')
PY

# Env token ưu tiên; không có thì kế thừa auth ~/.npmrc (không ghi .npmrc TMP).
if [ -n "${NPM_TOKEN:-}" ]; then
  printf '//registry.npmjs.org/:_authToken=%s\n@wakii:registry=https://registry.npmjs.org\n' "$NPM_TOKEN" > "$TMP/.npmrc"
fi
cd "$TMP"
npm publish --registry=https://registry.npmjs.org --access public
echo "✓ @wakii/ui-kit published (npmjs.org)"
