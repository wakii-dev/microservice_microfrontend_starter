// compose-yaml.mjs — insert/remove services in platform/docker-compose.yml and
// entries in pnpm-workspace.yaml. Strategy for LOSSLESS round-trips (gen → remove
// must leave the compose byte-identical): the `yaml` package is used to LOCATE the
// exact character ranges of nodes (CST ranges), while insertion/removal splice the
// ORIGINAL text — untouched regions never pass through a YAML serializer, so their
// flow style/comments survive byte-for-byte. Generated blocks are rendered by the
// callers in the repo's house style (inline flow arrays, aligned comments).
import { parseDocument } from 'yaml';

/** Parse + syntax check. Throws with the error list when the YAML is broken (file untouched). */
export function loadDoc(text, label = 'yaml') {
  const doc = parseDocument(text);
  if (doc.errors.length > 0) {
    const msgs = doc.errors.map((e) => `${e.name}: ${e.message}`).join('; ');
    throw new Error(`${text && label} does not parse — fix it manually before running the generator (${msgs})`);
  }
  return doc;
}

function servicesNode(doc) {
  const top = doc.get('services', true);
  if (!top || top.items === undefined) throw new Error('compose is missing the top-level `services:` key');
  return top;
}

function findPair(mapNode, key) {
  return mapNode.items.find((it) => it.key.value === key);
}

/** Key `name` already present in services → true (generator refuses a second run). */
export function composeHasService(text, name) {
  const doc = loadDoc(text, 'docker-compose.yml');
  return findPair(servicesNode(doc), name) !== undefined;
}

/**
 * Scan ALL host+container ports declared in the compose (patterns `${VAR:-n}:m` and
 * `n:m`) → Set<number>. Used to pick a free port (conventions/05 — no collisions).
 * Regex is READ-only here; edits go through range splicing.
 */
export function usedHostPorts(text) {
  const used = new Set();
  const patterns = [/\$\{[A-Z0-9_]+:-(\d+)\}:\s*(\d+)/g, /"(\d{2,5}):(\d{2,5})"/g];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      used.add(Number(m[1]));
      used.add(Number(m[2]));
    }
  }
  return used;
}

/** First free port in [start..end] — exhausted → throw (do NOT guess another port). */
export function pickFreePort(used, start, end) {
  for (let p = start; p <= end; p++) {
    if (!used.has(p)) return p;
  }
  throw new Error(`no free port left in ${start}-${end} — pass --port manually`);
}

// ---- range helpers (yaml CST gives node.range = [start, end] char offsets) ----

function lineStartBefore(text, offset) {
  return text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
}

function eolAfter(text, offset) {
  const i = text.indexOf('\n', offset);
  return i === -1 ? text.length : i + 1;
}

/**
 * End-of-line of the LAST CONTENT line inside a yaml node range. yaml CST ranges
 * swallow trailing blank lines / parent-owned comment lines (they extend to the next
 * token) — splicing at the raw range end would eat them, breaking byte-identical
 * round-trips. Trimming trailing blanks/comment lines lands the splice exactly after
 * the node's real content.
 */
function contentEndEol(text, range) {
  const raw = text.slice(range[0], range[1]);
  const trimmed = raw.replace(/(\n[ \t]*(?:#[^\n]*)?)+$/, '');
  return eolAfter(text, range[0] + trimmed.length);
}

/** Walk back from a key start over the contiguous `#` comment lines directly above it. */
function startIncludingComments(text, keyStart) {
  let start = lineStartBefore(text, keyStart);
  while (start > 0) {
    const prevStart = lineStartBefore(text, start - 1);
    const line = text.slice(prevStart, start - 1);
    if (line.trimStart().startsWith('#')) start = prevStart;
    else break;
  }
  return start;
}

/**
 * Same as startIncludingComments, plus: if a BLANK line directly precedes the comment
 * block, include it in the removal range. gen-service inserts `\n` + block (blank
 * separator included), so removal must take that separator back to stay byte-identical.
 */
function startIncludingCommentsAndBlank(text, keyStart) {
  let start = startIncludingComments(text, keyStart);
  if (start >= 2 && text[start - 1] === '\n' && text[start - 2] === '\n') start -= 1;
  return start;
}

/** Splice out [start, end) — caller passes absolute char offsets. */
function spliceRange(text, start, end) {
  return text.slice(0, start) + text.slice(end);
}

/** Entry indent (leading spaces) of a map item whose key node is given. */
function indentOf(text, keyStart) {
  const ls = lineStartBefore(text, keyStart);
  const line = text.slice(ls, keyStart);
  return line.match(/^ */)[0];
}

/**
 * Insert the pre-rendered service `blockText` at the END of the services map.
 * Already present → throw (idempotent-guard). blockText must start with its own
 * comment/indent (2 spaces) and end with `\n`.
 */
export function insertComposeService(text, name, blockText) {
  if (composeHasService(text, name)) {
    throw new Error(`compose already has service "${name}" — generator refuses to overwrite (idempotent-guard)`);
  }
  const doc = loadDoc(text, 'docker-compose.yml');
  const items = servicesNode(doc).items;
  if (items.length === 0) throw new Error('compose services map is empty — insert the block manually');
  const last = items[items.length - 1];
  const at = contentEndEol(text, last.value.range);
  return text.slice(0, at) + '\n' + blockText + text.slice(at);
}

/**
 * Remove the service block `name` (+ its comment lines), its entry in the `host`
 * depends_on map, and the listed keys from the postgres environment (db wiring).
 * Absent pieces are skipped (idempotent). Returns the new text (unchanged if absent).
 */
export function removeComposeService(text, name, { host = 'gateway', postgresEnvKeys = [] } = {}) {
  let out = text;

  // 1) the service block itself
  {
    const doc = loadDoc(out, 'docker-compose.yml');
    const pair = findPair(servicesNode(doc), name);
    if (pair) {
      out = spliceRange(out, startIncludingCommentsAndBlank(out, pair.key.range[0]), contentEndEol(out, pair.value.range));
    }
  }

  // 2) the depends_on entry of `host` (re-parse — offsets shifted)
  if (host) {
    const doc = loadDoc(out, 'docker-compose.yml');
    const gw = findPair(servicesNode(doc), host);
    const deps = gw?.value?.get?.('depends_on', true);
    const entry = deps?.items?.find((it) => it.key.value === name);
    if (entry) {
      out = spliceRange(out, startIncludingComments(out, entry.key.range[0]), contentEndEol(out, entry.value.range));
    }
  }

  // 3) postgres environment keys (db wiring passed into the init script)
  for (const key of postgresEnvKeys) {
    const doc = loadDoc(out, 'docker-compose.yml');
    const pg = findPair(servicesNode(doc), 'postgres');
    const env = pg?.value?.get?.('environment', true);
    const entry = env?.items?.find((it) => it.key.value === key);
    if (entry) {
      out = spliceRange(out, startIncludingComments(out, entry.key.range[0]), contentEndEol(out, entry.value.range));
    }
  }

  return out;
}

/**
 * Add `name` to the `depends_on` map of service `host` (gateway health-gating —
 * conventions/02 rule 3: BE = service_healthy; go/distroless = service_started).
 * Text-splice at the end of the existing map — lossless. Already there → no-op.
 */
export function addServiceDependsOn(text, host, name, condition, comment) {
  const doc = loadDoc(text, 'docker-compose.yml');
  const gw = findPair(servicesNode(doc), host);
  if (!gw) throw new Error(`compose has no service "${host}" — cannot add depends_on`);
  let deps = gw.value.get('depends_on', true);
  if (!deps || deps.items === undefined) throw new Error(`service "${host}" has no depends_on map — add the entry manually`);
  if (deps.items.some((it) => it.key.value === name)) return text; // already there — no-op
  const last = deps.items[deps.items.length - 1];
  const at = contentEndEol(text, last.value.range);
  const indent = indentOf(text, last.key.range[0]);
  const commentLine = comment ? `${indent}# ${comment.trim()}\n` : '';
  const entry = `${indent}${name}:\n${indent}  condition: ${condition}\n`;
  return text.slice(0, at) + commentLine + entry + text.slice(at);
}

/**
 * Add one env var to the `environment` map of service `host` (used for --db wiring
 * into the postgres container). Text-splice — lossless. Already there → no-op.
 */
export function addServiceEnv(text, host, key, value) {
  const doc = loadDoc(text, 'docker-compose.yml');
  const svc = findPair(servicesNode(doc), host);
  if (!svc) throw new Error(`compose has no service "${host}"`);
  const env = svc.value.get('environment', true);
  if (!env || env.items === undefined) throw new Error(`service "${host}" has no environment map — add the var manually`);
  if (env.items.some((it) => it.key.value === key)) return text; // idempotent
  const last = env.items[env.items.length - 1];
  const at = contentEndEol(text, last.value.range);
  const indent = indentOf(text, last.key.range[0]);
  return text.slice(0, at) + `${indent}${key}: ${value}\n` + text.slice(at);
}

/**
 * Add `- "services/<name>"` to the `packages:` list of pnpm-workspace.yaml (a TS
 * service is a workspace member — node-svc/auth-svc precedent). yaml round-trip is
 * byte-stable for this file (verified in the roundtrip gate).
 */
export function insertWorkspacePackage(text, pkgPath) {
  const doc = loadDoc(text, 'pnpm-workspace.yaml');
  const seq = doc.get('packages', true);
  if (!seq || seq.items === undefined) throw new Error('pnpm-workspace.yaml is missing `packages:`');
  if (seq.items.some((it) => it.value === pkgPath || it.value === `"${pkgPath}"`)) return text;
  seq.items.push(doc.createNode(pkgPath));
  return doc.toString({ lineWidth: 0 });
}

/** Remove `pkgPath` from the packages list. Missing → text unchanged (idempotent). */
export function removeWorkspacePackage(text, pkgPath) {
  const doc = loadDoc(text, 'pnpm-workspace.yaml');
  const seq = doc.get('packages', true);
  if (!seq || seq.items === undefined) return text;
  const idx = seq.items.findIndex((it) => it.value === pkgPath || it.value === `"${pkgPath}"`);
  if (idx === -1) return text;
  seq.items.splice(idx, 1);
  return doc.toString({ lineWidth: 0 });
}
