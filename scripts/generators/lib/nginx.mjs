// nginx.mjs — insert/remove location blocks in platform/gateway/nginx/nginx.conf.
// nginx is not yaml → edits use the `# >>> GEN:*` marker comments (mission spec)
// placed around a stable anchor LINE of the existing conf. The first run CREATES the
// marker pair at the anchor (both markers on their own lines, at line boundaries —
// never mid-line); later runs insert inside the region. Removal operates strictly
// inside the markers and drops an EMPTY marker pair entirely, so gen → remove leaves
// the conf byte-identical. Neither marker nor anchor found → null.
import { insertBefore } from './io.mjs';

// Anchor for API location blocks: the line BEFORE the 401-envelope section (the conf
// has this comment line — conventions/04). The GEN:services marker pair is created here.
// NOTE: this string is a BYTE-EXACT locator of an EXISTING (Vietnamese) comment in the
// repo's nginx.conf — it is matched, not authored; do not translate it.
export const API_ANCHOR = '# ---------- 401 body theo error envelope chung (conventions/04) ----------';
export const API_MARKERS = { open: '        # >>> GEN:services (scripts/generators — auto, do not edit inside this region)', close: '        # <<< GEN:services' };
// Anchor for the $remote_up map: the default line pointing at shell (conf — conventions/08).
export const REMOTE_ANCHOR = '"http://shell:3000";';
export const REMOTE_MARKERS = { open: '        # >>> GEN:remotes (scripts/generators — auto, do not edit inside this region)', close: '        # <<< GEN:remotes' };

/**
 * Location block for an API service (conventions/08): pass-through (proxy_pass has
 * NO URI part), lazy DNS via variable + resolver, presence-check 401 when auth=true.
 * The 401 error body reuses the conf-wide @unauthorized (envelope — conventions/04).
 */
export function apiLocationBlock(name, port, { auth = true } = {}) {
  const guard = auth
    ? '            if ($http_authorization = "") { return 401; }\n'
    : '            # open — public entry point (login/health), conventions/08\n';
  const block = (path) =>
    `        location ${path} {\n` +
    guard +
    `            set $up http://${name}:${port};\n` +
    '            proxy_pass $up;\n' +
    '            proxy_set_header Host $host;\n' +
    '            proxy_set_header X-Request-Id $req_id;\n' +
    '        }\n';
  const head = `        # ---------- API: ${name} → ${name}:${port} (gen ${new Date().toISOString().slice(0, 10)}) ----------\n`;
  return head + block(`= /api/${name}`) + block(`/api/${name}/`);
}

export function remoteMapLine(name, port) {
  // indentation follows the existing $remote_up map style (8 spaces + regex + pad + quoted upstream)
  return `        ~^/remotes/${name}/    "http://remote-${name}:${port}";\n`;
}

export function hasApiLocation(text, name) {
  return text.includes(`location /api/${name}/`);
}

/** Anchor line (with its original indentation) that contains the given anchor substring. */
function anchorLine(text, anchor) {
  const idx = text.indexOf(anchor);
  if (idx === -1) return null;
  const lineStart = text.lastIndexOf('\n', idx) + 1;
  const lineEnd = text.indexOf('\n', idx);
  const line = lineEnd === -1 ? text.slice(lineStart) : text.slice(lineStart, lineEnd);
  return line + '\n';
}

/**
 * Insert (or skip when present) the location block for an API service.
 * Returns { text, createdMarkers } or null (neither marker nor anchor found).
 */
export function insertApiLocation(text, name, port, opts = {}) {
  if (hasApiLocation(text, name)) {
    throw new Error(`nginx.conf already routes /api/${name} — generator refuses to overwrite (idempotent-guard)`);
  }
  if (text.includes(API_MARKERS.open)) {
    if (!text.includes(API_MARKERS.close)) {
      throw new Error('GEN:services open marker found without its close marker — fix nginx.conf manually, then rerun');
    }
    const closeIdx = text.indexOf(API_MARKERS.close);
    const content = apiLocationBlock(name, port, opts);
    return { text: text.slice(0, closeIdx) + content + text.slice(closeIdx), createdMarkers: false };
  }
  const anchor = anchorLine(text, API_ANCHOR);
  if (anchor === null) return null;
  const block = `${API_MARKERS.open}\n${apiLocationBlock(name, port, opts)}${API_MARKERS.close}\n`;
  const next = insertBefore(text, anchor, block);
  return next === null ? null : { text: next, createdMarkers: true };
}

/**
 * Remove the per-service block (header comment + both location blocks) from the
 * GEN:services region. When the region becomes empty the whole marker pair is
 * dropped too → byte-identical restore. Absent markers/block → { removed: false }.
 */
export function removeApiLocation(text, name) {
  if (!text.includes(API_MARKERS.open)) return { text, removed: false };
  const openIdx = text.indexOf(API_MARKERS.open);
  const closeIdx = text.indexOf(API_MARKERS.close, openIdx);
  if (closeIdx === -1) {
    throw new Error('GEN:services open marker found without its close marker — fix nginx.conf manually, then rerun');
  }
  const region = text.slice(openIdx, closeIdx);
  const header = `# ---------- API: ${name} →`;
  const pattern = new RegExp(`[ \\t]*# ---------- API: ${name} → [\\s\\S]*?location /api/${name}/ \\{[\\s\\S]*?\\n {8}\\}\\n`, '');
  const cleaned = region.replace(pattern, '');
  if (cleaned === region) return { text, removed: false };
  if (cleaned.trim() === API_MARKERS.open.trim()) {
    // region is now empty — drop the whole marker pair (restores the original bytes)
    const afterCloseEol = (() => {
      const i = text.indexOf('\n', closeIdx);
      return i === -1 ? text.length : i + 1;
    })();
    return { text: text.slice(0, openIdx) + text.slice(afterCloseEol), removed: true };
  }
  return { text: text.slice(0, openIdx) + cleaned + text.slice(closeIdx), removed: true };
}

/** Insert the $remote_up map line for a static FE remote (strip-prefix /remotes/ is shared). */
export function insertRemoteMapLine(text, name, port) {
  if (text.includes(`~^/remotes/${name}/`)) {
    throw new Error(`nginx.conf already maps /remotes/${name} — idempotent-guard`);
  }
  if (text.includes(REMOTE_MARKERS.open)) {
    if (!text.includes(REMOTE_MARKERS.close)) {
      throw new Error('GEN:remotes open marker found without its close marker — fix nginx.conf manually, then rerun');
    }
    const closeIdx = text.indexOf(REMOTE_MARKERS.close);
    return { text: text.slice(0, closeIdx) + remoteMapLine(name, port) + text.slice(closeIdx), createdMarkers: false };
  }
  // the anchor sits MID-LINE (`default   "http://shell:3000";`) — insert before the
  // START of that line, never between `default` and its value (would break the conf).
  const line = anchorLine(text, REMOTE_ANCHOR);
  if (line === null) return null;
  const block = `${REMOTE_MARKERS.open}\n${remoteMapLine(name, port)}${REMOTE_MARKERS.close}\n`;
  const next = insertBefore(text, line, block);
  return next === null ? null : { text: next, createdMarkers: true };
}
