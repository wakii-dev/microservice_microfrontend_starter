#!/usr/bin/env bash
# Publish @wakii/ui-kit lên npmjs.org (bản public đúng brand).
# Registry GitHub Packages (@wakii-dev/ui-kit) publish trực tiếp bằng pnpm — xem RELEASE.md.
#
# Cần: NPM_TOKEN = npm Automation token của account npm "wakii"
#   NPM_TOKEN=npm_xxx ./scripts/publish-npm.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -n "${NPM_TOKEN:-}" ] || { echo "✗ Thiếu NPM_TOKEN (npm Automation token account wakii)"; exit 1; }
grep -q '"name": "@wakii-dev/ui-kit"' package.json || { echo "✗ package.json không phải @wakii-dev/ui-kit (sai repo state)"; exit 1; }

echo "▶ Build mới (tsup + CSS compiled)..."
pnpm build

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp -r dist src/styles README.md LICENSE package.json "$TMP/"

python3 - "$TMP" << 'PY'
import json, sys
p = json.load(open(f'{sys.argv[1]}/package.json'))
p['name'] = '@wakii/ui-kit'                      # scope npm org wakii (npmjs)
p.get('publishConfig', {}).pop('registry', None) # → registry mặc định npmjs.org
for k in ('devDependencies', 'scripts', 'overrides'): p.pop(k, None)
json.dump(p, open(f'{sys.argv[1]}/package.json', 'w'), indent=2, ensure_ascii=False)
open(f'{sys.argv[1]}/package.json', 'a').write('\n')
PY

printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$TMP/.npmrc"
cd "$TMP"
npm publish --access public
echo "✓ @wakii/ui-kit published"
