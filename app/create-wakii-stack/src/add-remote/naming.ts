// naming — remote-name validation + identifier variants derived from it.
// The gateway strip-rewrite (`platform/gateway/nginx/nginx.conf`) works on
// lowercase/dash path segments, and the MF name must be a valid JS identifier
// chunk — enforce kebab-case (lowercase start, digits/dashes allowed after).

export interface RemoteNames {
  /** Raw validated name — compose service `remote-<name>`, MF name, dir name. */
  name: string;
  /** PascalCase — page component/expose key suffix (`inventory` → `Inventory`). */
  pascal: string;
  /** UPPER_SNAKE — env var chunk (`user-profile` → `USER_PROFILE`). */
  upper: string;
  /** Full env var for the dev-server port (`REMOTE_INVENTORY_PORT`). */
  envPort: string;
  /** Full env var for the remoteEntry URL (`REMOTE_INVENTORY_URL`). */
  envUrl: string;
  /** npm package name (`@wakii/remote-inventory`). */
  pkgName: string;
  /** MF expose key (`./InventoryPage`). */
  exposeKey: string;
  /** Page component + file stem (`InventoryPage` → `src/InventoryPage.tsx`). */
  pageComponent: string;
}

/** kebab-case: starts with a lowercase letter, then lowercase letters/digits/dashes;
 * no leading/trailing/double dashes. Digits are allowed (the nginx strip-rewrite
 * edge case still resolves — the remote's own nginx alias serves the unstripped
 * prefix, verified against conventions/08 routing rules). */
const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Validate a remote name, returning a human-readable error or null. */
export function validateRemoteName(name: string): string | null {
  if (!name) return 'Remote name is required (usage: add-remote <name> [dest])';
  if (name.length > 40) return `Remote name too long (${name.length} > 40 chars): ${name}`;
  if (!NAME_RE.test(name)) {
    return `Invalid remote name "${name}" — use kebab-case: lowercase letters/digits separated by single dashes (e.g. inventory, user-profile)`;
  }
  return null;
}

/** Capitalize one dash-separated chunk. */
function pascalChunk(chunk: string): string {
  return chunk.charAt(0).toUpperCase() + chunk.slice(1);
}

/** Derive every identifier variant add-remote needs from a validated name. */
export function remoteNames(name: string): RemoteNames {
  const pascal = name.split('-').map(pascalChunk).join('');
  const upper = name.split('-').join('_').toUpperCase();
  return {
    name,
    pascal,
    upper,
    envPort: `REMOTE_${upper}_PORT`,
    envUrl: `REMOTE_${upper}_URL`,
    pkgName: `@wakii/remote-${name}`,
    exposeKey: `./${pascal}Page`,
    pageComponent: `${pascal}Page`,
  };
}
