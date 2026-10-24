#!/usr/bin/env bash
# Publish @wakii/ui-kit lên npmjs.org (canonical scope @wakii — KHÔNG đổi name).
# Mirror của publish-github.sh — chỉ đổi đích registry + giữ nguyên tên package.
# Xem RELEASE.md bước 3.
#
# Cần: NPM_TOKEN = npm_xxx (automation/granular token có quyền publish scope @wakii)
#   NPM_TOKEN=npm_xxx ./scripts/publish-npm.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -n "${NPM_TOKEN:-}" ] || { echo "✗ Thiếu NPM_TOKEN (token publish npmjs.org cho scope @wakii)"; exit 1; }
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

# Giữ NGUYÊN name @wakii/ui-kit (canonical npmjs); registry đích npmjs; bỏ phần
# không cần khi publish (devDeps/scripts/overrides — mirror publish-github.sh).
python3 - "$TMP" << 'PY'
import json, sys
p = json.load(open(f'{sys.argv[1]}/package.json'))
p['publishConfig']['registry'] = 'https://registry.npmjs.org'
for k in ('devDependencies', 'scripts', 'overrides'): p.pop(k, None)
json.dump(p, open(f'{sys.argv[1]}/package.json', 'w'), indent=2, ensure_ascii=False)
open(f'{sys.argv[1]}/package.json', 'a').write('\n')
PY

printf '//registry.npmjs.org/:_authToken=%s\n@wakii:registry=https://registry.npmjs.org\n' "$NPM_TOKEN" > "$TMP/.npmrc"
cd "$TMP"
npm publish --registry=https://registry.npmjs.org --access public
echo "✓ @wakii/ui-kit published (npmjs.org)"
