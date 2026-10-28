#!/usr/bin/env bash
# Publish @wakii/fe-shared lên npmjs.org — dist build + rewrite exports sang dist
# (hotfix 0.4.1 pattern ui-kit: consumers npm ngoài monorepo không resolve được entry .ts).
# Repo package.json KHÔNG bị đổi: monorepo vẫn consumed-qua-source (ADR-0009), mọi
# rewrite chỉ xảy ra trong TMP copy.
#
# Auth: hoặc env NPM_TOKEN (npm_xxx quyền publish scope @wakii), hoặc đã lưu token
# wakii trong ~/.npmrc (như ui-kit 2026-10-24).
#
# PREPARE_ONLY=1 → build + copy + rewrite + npm pack rồi DỪNG (giữ lại TMP, in đường
# dẫn tarball) — dùng để consume-test tarball TRƯỚC khi publish thật.
set -euo pipefail
cd "$(dirname "$0")/.."

grep -q '"name": "@wakii/fe-shared"' package.json || { echo "✗ package.json không phải @wakii/fe-shared (sai repo state)"; exit 1; }

if [ "${PREPARE_ONLY:-0}" != "1" ]; then
  NPMRC_AUTH="$(grep -s '^//registry\.npmjs\.org/:_authToken=' "${NPM_CONFIG_USERCONFIG:-$HOME/.npmrc}" | head -1 || true)"
  if [ -z "${NPM_TOKEN:-}" ] && [ -z "$NPMRC_AUTH" ]; then
    echo "✗ Thiếu NPM_TOKEN (env) hoặc _authToken cho registry.npmjs.org trong ~/.npmrc"; exit 1
  fi
fi

echo "▶ Build dist (tsup)..."
pnpm build

TMP=$(mktemp -d)
# Tarball chỉ cần dist + README + package.json (files field = ["dist"]); repo source
# KHÔNG vào package npm — consumers dùng dist exports + .d.ts.
cp -r dist README.md package.json "$TMP/"

# Exports ĐỔI SANG DIST (pattern hotfix 0.4.1 ui-kit): repo exports trỏ TS source cho
# monorepo; npm package nhận dist (js/cjs/d.ts đủ 5 entry). Strip phần dev (devDeps/
# scripts/private) — private phải bỏ hoặc npm publish từ chối.
python3 - "$TMP" << 'PY'
import json, sys
p = json.load(open(f'{sys.argv[1]}/package.json'))
p.pop('private', None)
p['publishConfig'] = {'registry': 'https://registry.npmjs.org', 'access': 'public'}

def dist_entry(name):
    return {
        'types': f'./dist/{name}.d.ts',
        'import': f'./dist/{name}.js',
        'require': f'./dist/{name}.cjs',
    }

p['exports'] = {
    '.': dist_entry('index'),
    './api-client': dist_entry('api-client'),
    './token-storage': dist_entry('token-storage'),
    './error-envelope': dist_entry('error-envelope'),
    './mf-bootstrap': dist_entry('mf-bootstrap'),
}
p['main'] = './dist/index.cjs'
p['module'] = './dist/index.js'
p['types'] = './dist/index.d.ts'
for k in ('devDependencies', 'scripts'):
    p.pop(k, None)
json.dump(p, open(f'{sys.argv[1]}/package.json', 'w'), indent=2, ensure_ascii=False)
open(f'{sys.argv[1]}/package.json', 'a').write('\n')
PY

cd "$TMP"
echo "▶ npm pack (liệt kê tarball)..."
PACK_OUTPUT="$(npm pack)"
TGZ="$TMP/$(echo "$PACK_OUTPUT" | tail -1)"
echo "$PACK_OUTPUT"

if [ "${PREPARE_ONLY:-0}" = "1" ]; then
  echo "✓ PREPARE_ONLY — giữ TMP để consume-test: $TMP"
  echo "  tarball: $TGZ"
  exit 0
fi

trap 'rm -rf "$TMP"' EXIT
# Env token ưu tiên; không có thì kế thừa auth ~/.npmrc (không ghi .npmrc TMP).
if [ -n "${NPM_TOKEN:-}" ]; then
  printf '//registry.npmjs.org/:_authToken=%s\n@wakii:registry=https://registry.npmjs.org\n' "$NPM_TOKEN" > "$TMP/.npmrc"
fi
npm publish --registry=https://registry.npmjs.org --access public
echo "✓ @wakii/fe-shared published (npmjs.org)"
