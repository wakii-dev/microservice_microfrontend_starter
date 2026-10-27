// io.mjs — file helpers for generators: guarded read/write, marker-scoped insertion.
// All new files go through writeNew — NEVER overwrite an existing file
// (idempotent-guard: already exists → clear error, the caller decides).
import fs from 'node:fs';
import path from 'node:path';

export function exists(p) {
  return fs.existsSync(p);
}

export function isDir(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

export function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

/** Deliberate overwrite — ONLY for functions editing existing infra files (compose/nginx/env). */
export function writeText(p, content) {
  fs.writeFileSync(p, content);
  return p;
}

/** Write a NEW file — throws if it already exists (idempotent-guard). */
export function writeNew(file, content) {
  if (fs.existsSync(file)) {
    throw new Error(`already exists, refusing to overwrite: ${file} (delete manually to regenerate)`);
  }
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return file;
}

/** Write multiple files {relPath: content} under rootDir. Returns the list of written paths. */
export function writeTree(rootDir, files) {
  const written = [];
  for (const [rel, content] of Object.entries(files)) {
    written.push(writeNew(path.join(rootDir, rel), content));
  }
  return written;
}

/** Remove a directory tree (used by remove:service). Missing path → no-op, returns false. */
export function removeTree(dir) {
  if (!fs.existsSync(dir)) return false;
  fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/**
 * Insert `block` IMMEDIATELY BEFORE the line containing `anchor` (literal match).
 * Anchor not found → null (caller decides error vs fallback).
 */
export function insertBefore(text, anchor, block) {
  const idx = text.indexOf(anchor);
  if (idx === -1) return null;
  return text.slice(0, idx) + block + text.slice(idx);
}

/**
 * Insert `content` BETWEEN the marker pair `open`/`close` (appended at the end of
 * the region). Markers missing yet → create the pair at `anchor` (insertBefore).
 * Returns { text, created: boolean } — null if no insertion point was found.
 */
export function insertIntoMarkers(text, { open, close, anchor, content }) {
  if (text.includes(open)) {
    if (!text.includes(close)) {
      throw new Error(`found open marker "${open}" but the close marker "${close}" is missing — fix the file manually, then rerun`);
    }
    const closeIdx = text.indexOf(close);
    return { text: text.slice(0, closeIdx) + content + text.slice(closeIdx), created: false };
  }
  const block = `${open}\n${content}${close}\n`;
  const next = insertBefore(text, anchor, block);
  return next === null ? null : { text: next, created: true };
}

/**
 * Remove content BETWEEN markers that matches `pattern` (regex) — used by
 * remove:service to strip one service's block out of the GEN region.
 * Returns { text, removed: boolean }. Markers absent → { text unchanged, removed: false }.
 */
export function removeFromMarkers(text, { open, close, pattern }) {
  if (!text.includes(open)) return { text, removed: false };
  const openIdx = text.indexOf(open);
  const closeIdx = text.indexOf(close, openIdx);
  if (closeIdx === -1) {
    throw new Error(`found open marker "${open}" but the close marker "${close}" is missing — fix the file manually, then rerun`);
  }
  const region = text.slice(openIdx, closeIdx);
  const cleaned = region.replace(pattern, '');
  if (cleaned === region) return { text, removed: false };
  return { text: text.slice(0, openIdx) + cleaned + text.slice(closeIdx), removed: true };
}
