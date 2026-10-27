// result.mjs — output contract for gen:* / remove:* (AI-first, user rule 2026-10-27):
// JSON is the PRIMARY contract: `--json` → { created, removed, modified, next_steps }.
// next_steps = AI-actionable directives (verb-first + path + action), NOT human prose.
// Text mode (default) = same data, one item per line `created:/removed:/modified:/next:`
// — parseable, NO decorative ASCII.
//
// Exit codes: 0 ok · 1 validation/guard error · 2 unexpected IO error.

export class GenResult {
  constructor() {
    this.created = []; // new files written (repo-relative paths)
    this.removed = []; // files/dirs/entries removed (repo-relative or symbolic)
    this.modified = []; // existing files with insertions/edits (repo-relative)
    this.nextSteps = []; // directives the AI should run next
  }

  createdFile(...paths) {
    this.created.push(...paths);
  }

  removedItem(...items) {
    this.removed.push(...items);
  }

  modifiedFile(...paths) {
    this.modified.push(...paths);
  }

  next(...directives) {
    this.nextSteps.push(...directives);
  }

  /** {created, removed, modified, next_steps} — stable JSON field names for AI parsing. */
  toJSON() {
    return {
      created: this.created,
      removed: this.removed,
      modified: this.modified,
      next_steps: this.nextSteps,
    };
  }

  /** Text mode — one item per line, machine-readable prefix (no boxes/decoration). */
  toText() {
    const lines = [];
    for (const p of this.created) lines.push(`created: ${p}`);
    for (const p of this.removed) lines.push(`removed: ${p}`);
    for (const p of this.modified) lines.push(`modified: ${p}`);
    for (const s of this.nextSteps) lines.push(`next: ${s}`);
    if (lines.length === 0) lines.push('ok: (nothing changed — everything already in target state)');
    return lines.join('\n');
  }
}

/** Emit the result in the requested mode; returns exit code for process.exit. */
export function emit(result, { json = false, out = process.stdout } = {}) {
  out.write(json ? `${JSON.stringify(result.toJSON(), null, 2)}\n` : `${result.toText()}\n`);
}

/** Emit an error — one stderr line in text mode; {"error":{"message"}} in --json mode. */
export function emitError(err, { json = false, out = process.stderr } = {}) {
  const message = err instanceof Error ? err.message : String(err);
  out.write(json ? `${JSON.stringify({ error: { message } }, null, 2)}\n` : `error: ${message}\n`);
}

/** Format `--help` — plain text with examples + conventions refs. */
export function helpText({ usage, summary, flags, examples, refs }) {
  const lines = [usage, '', summary, '', 'Flags:'];
  for (const f of flags) {
    const [name, desc] = Array.isArray(f) ? f : [f, ''];
    lines.push(desc ? `  ${name}${' '.repeat(Math.max(2, 22 - name.length))}${desc}` : `  ${name}`);
  }
  lines.push('', 'Examples:');
  for (const ex of examples) lines.push(`  ${ex}`);
  if (refs?.length) {
    lines.push('', 'Conventions applied:');
    for (const r of refs) lines.push(`  ${r}`);
  }
  lines.push('', 'Output: --json → {created, removed, modified, next_steps} (AI contract); default text prints one `created:/removed:/modified:/next:` line per item.');
  return lines.join('\n');
}
