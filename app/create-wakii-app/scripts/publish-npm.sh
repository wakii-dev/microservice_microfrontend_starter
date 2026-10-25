#!/usr/bin/env bash
# Publish create-wakii-app lên npmjs.org — bundle starter-templates VÀO package
# (npm files không nhận path cha '../' — engine resolve <pkg>/starter-templates).
# Auth: env NPM_TOKEN hoặc ~/.npmrc đã có token wakii (mirror ui-kit script).
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
mkdir -p "$TMP/starter-templates"
cp -r ../starter-templates/. "$TMP/starter-templates/"
[ -f "$TMP/starter-templates/vite-ts/package.json" ] || { echo "✗ thiếu template vite-ts sau copy"; exit 1; }

python3 - "$TMP" << 'PY'
import json, sys
p = json.load(open(f'{sys.argv[1]}/package.json'))
p['publishConfig'] = {'registry': 'https://registry.npmjs.org', 'access': 'public'}
p['files'] = ['dist', 'starter-templates', 'README.md']
for k in ('devDependencies', 'scripts', 'private'): p.pop(k, None)
json.dump(p, open(f'{sys.argv[1]}/package.json', 'w'), indent=2, ensure_ascii=False)
open(f'{sys.argv[1]}/package.json', 'a').write('\n')
PY

if [ -n "${NPM_TOKEN:-}" ]; then
  printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$TMP/.npmrc"
fi
cd "$TMP"
npm publish --registry=https://registry.npmjs.org --access public
echo "✓ create-wakii-app published (npmjs.org)"
