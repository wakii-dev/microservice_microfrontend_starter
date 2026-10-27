// manifest.mjs — add/remove a service entry in the stack manifest
// (app/stack-template/stack-manifest.json — source of truth for create-wakii-stack
// pruning). The file is plain JSON: parse → mutate the `services` list → stringify
// with the file's 2-space indent; key order is preserved by JSON.parse/stringify.
import { exists, readText, writeText } from './io.mjs';

/**
 * Append a service entry to `services`. Duplicate id → throw (idempotent-guard).
 * Entry shape mirrors existing `be` entries (node-svc precedent):
 * { id, type, description, paths, composeService, gatewayBlocks, envKeys, requires, devLocal }.
 */
export function insertManifestService(manifestPath, entry) {
  if (!exists(manifestPath)) throw new Error(`stack manifest not found: ${manifestPath}`);
  const manifest = JSON.parse(readText(manifestPath));
  if (!Array.isArray(manifest.services)) throw new Error('stack manifest has no `services` list');
  if (manifest.services.some((s) => s.id === entry.id)) {
    throw new Error(`stack manifest already has service "${entry.id}" — idempotent-guard`);
  }
  manifest.services.push(entry);
  writeText(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

/** Remove the entry with `id` from `services`. Missing → no-op (idempotent). Returns true when removed. */
export function removeManifestService(manifestPath, id) {
  if (!exists(manifestPath)) return false;
  const manifest = JSON.parse(readText(manifestPath));
  if (!Array.isArray(manifest.services)) return false;
  const idx = manifest.services.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  manifest.services.splice(idx, 1);
  writeText(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return true;
}
