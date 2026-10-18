#!/usr/bin/env bash
# Publish @wakii-dev/ui-kit lên GitHub Packages (mirror org nội bộ — canonical là @wakii/ui-kit trên npmjs, publish trực tiếp bằng pnpm).
# Registry GitHub Packages (@wakii/ui-kit) publish trực tiếp bằng pnpm — xem RELEASE.md.
#
# Cần: GH_PACKAGES_TOKEN = ghp PAT write:packages của account GitHub wakii-dev
#   NPM_TOKEN=npm_xxx ./scripts/publish-npm.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -n "${GH_PACKAGES_TOKEN:-}" ] || { echo "✗ Thiếu GH_PACKAGES_TOKEN (PAT wakii-dev)"; exit 1; }
grep -q '"name": "@wakii/ui-kit"' package.json || { echo "✗ package.json không phải @wakii/ui-kit (sai repo state)"; exit 1; }

echo "▶ Build mới (tsup + CSS compiled)..."
pnpm build

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp -r dist src/styles README.md LICENSE package.json "$TMP/"

python3 - "$TMP" << 'PY'
import json, sys
p = json.load(open(f'{sys.argv[1]}/package.json'))
p['name'] = '@wakii-dev/ui-kit'                    # scope GitHub org wakii-dev
p['publishConfig']['registry'] = 'https://npm.pkg.github.com'
for k in ('devDependencies', 'scripts', 'overrides'): p.pop(k, None)
json.dump(p, open(f'{sys.argv[1]}/package.json', 'w'), indent=2, ensure_ascii=False)
open(f'{sys.argv[1]}/package.json', 'a').write('\n')
PY

printf '//npm.pkg.github.com/:_authToken=%s\n@wakii-dev:registry=https://npm.pkg.github.com\n' "$GH_PACKAGES_TOKEN" > "$TMP/.npmrc"
cd "$TMP"
npm publish --registry=https://npm.pkg.github.com
echo "✓ @wakii-dev/ui-kit published (GitHub Packages)"
