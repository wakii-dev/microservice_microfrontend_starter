// envfile.mjs — add/remove env vars in platform/.env.example (conventions/06 rule 2:
// complete inventory, every var carries a one-line comment). New sections append at
// EOF (easy to review) — existing sections are never touched (other people's WIP).
import { exists, readText, writeText } from './io.mjs';

/**
 * Append a new env section. Keys already present in the file are skipped (never
 * overwritten). Returns { added: string[] } — empty array = file UNCHANGED
 * (the caller must not report it as modified).
 */
export function appendEnvSection(envPath, { header, vars }) {
  // vars: [{ key, value, comment }]
  if (!exists(envPath)) throw new Error(`file not found: ${envPath}`);
  const text = readText(envPath);
  const missing = vars.filter((v) => !new RegExp(`^${v.key}=`, 'm').test(text));
  if (missing.length === 0) return { added: [] };
  const block =
    `\n# --- ${header} (gen ${new Date().toISOString().slice(0, 10)}) ---\n` +
    missing
      .map((v) => `${v.comment ? `# ${v.comment}\n` : ''}${v.key}=${v.value}`)
      .join('\n') +
    '\n';
  writeText(envPath, text.replace(/\n*$/, '\n') + block);
  return { added: missing.map((v) => v.key) };
}

/**
 * Remove the generated section of `header` (from its `# --- <header> (gen <date>) ---`
 * line until the next `# --- ` header or EOF) plus any stray generated key lines of
 * `keys` elsewhere in the file. Returns the keys actually removed (empty = no-op).
 */
export function removeEnvKeys(envPath, { header, keys }) {
  if (!exists(envPath)) throw new Error(`file not found: ${envPath}`);
  const original = readText(envPath);
  const lines = original.split('\n');
  const keySet = new Set(keys);
  const removed = [];

  // drop the generated section (header line → next `# --- ` header or EOF),
  // collecting which requested keys lived inside it
  const headerLine = `# --- ${header} (gen `;
  const hi = lines.findIndex((l) => l.startsWith(headerLine));
  if (hi !== -1) {
    let end = lines.length;
    for (let i = hi + 1; i < lines.length; i++) {
      if (lines[i].startsWith('# --- ')) {
        end = i;
        break;
      }
    }
    for (const line of lines.slice(hi, end)) {
      const m = line.match(/^([A-Z0-9_]+)=/);
      if (m && keySet.has(m[1])) removed.push(m[1]);
    }
    lines.splice(hi, end - hi);
    // collapse the blank line left above the cut
    while (hi > 0 && lines[hi - 1] === '' && (lines[hi] === '' || lines[hi] === undefined)) lines.splice(hi - 1, 1);
  }

  // drop stray generated key lines anywhere else (e.g. edited out of the section)
  const remaining = new Set(removed);
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (m && keySet.has(m[1]) && !remaining.has(m[1])) {
      removed.push(m[1]);
      remaining.add(m[1]);
    }
  }
  for (const key of remaining) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith(`${key}=`)) {
        // also drop the generated comment line directly above (starts with "# ")
        if (i > 0 && /^# .+/.test(lines[i - 1]) && !lines[i - 1].startsWith('# --- ')) lines.splice(i - 1, 1);
        lines.splice(i - 1, 1);
      }
    }
  }

  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n');
  if (text !== original) writeText(envPath, text);
  return { removed };
}
