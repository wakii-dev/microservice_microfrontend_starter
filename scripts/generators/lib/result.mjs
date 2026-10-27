// result.mjs — output contract của gen:* (AI-first, Điều chỉnh user 2026-10-27):
// JSON là contract CHÍNH: `--json` → { created, modified, next_steps, port? }.
// next_steps = directives AI thực hiện được (verb-first + đường dẫn + hành động),
// KHÔNG phải hướng dẫn người đọc. Text mode (mặc định) = cùng dữ liệu, mỗi dòng
// một mục `created:/modified:/next:` — parse được, KHÔNG ASCII trang trí.
//
// Exit code: 0 ok · 1 lỗi validate/guard · 2 lỗi hệ thống (file IO ngoài dự kiến).

export class GenResult {
  constructor() {
    this.created = []; // file mới sinh (path tuyệt đối→ repo-relative)
    this.modified = []; // file có sẵn được chèn (repo-relative)
    this.nextSteps = []; // directives AI làm tiếp
  }

  createdFile(...paths) {
    this.created.push(...paths);
  }

  modifiedFile(...paths) {
    this.modified.push(...paths);
  }

  next(...directives) {
    this.nextSteps.push(...directives);
  }

  /** {created, modified, next_steps} — field name JSON ổn định, AI parse. */
  toJSON() {
    return { created: this.created, modified: this.modified, next_steps: this.nextSteps };
  }

  /** Text mode — mỗi dòng 1 mục, prefix máy đọc được (không box/ký tự trang trí). */
  toText() {
    const lines = [];
    for (const p of this.created) lines.push(`created: ${p}`);
    for (const p of this.modified) lines.push(`modified: ${p}`);
    for (const s of this.nextSteps) lines.push(`next: ${s}`);
    if (lines.length === 0) lines.push('ok: (không thay đổi — mọi thứ đã tồn tại)');
    return lines.join('\n');
  }
}

/** In kết quả theo mode rồi trả exit code cho process.exit. */
export function emit(result, { json = false, out = process.stdout } = {}) {
  out.write(json ? `${JSON.stringify(result.toJSON(), null, 2)}\n` : `${result.toText()}\n`);
}

/** In lỗi — text 1 dòng stderr; --json thì {error:{message}} để AI parse. */
export function emitError(err, { json = false, out = process.stderr } = {}) {
  const message = err instanceof Error ? err.message : String(err);
  out.write(json ? `${JSON.stringify({ error: { message } }, null, 2)}\n` : `error: ${message}\n`);
}

/** Format `--help` — plain text, có ví dụ + conventions refs. */
export function helpText({ usage, summary, flags, examples, refs }) {
  const lines = [usage, '', summary, '', 'Flags:'];
  for (const f of flags) {
    const [name, desc] = Array.isArray(f) ? f : [f, ''];
    lines.push(desc ? `  ${name}${' '.repeat(Math.max(2, 22 - name.length))}${desc}` : `  ${name}`);
  }
  lines.push('', 'Ví dụ:');
  for (const ex of examples) lines.push(`  ${ex}`);
  if (refs?.length) {
    lines.push('', 'Conventions áp dụng:');
    for (const r of refs) lines.push(`  ${r}`);
  }
  lines.push('', 'Output: --json → {created, modified, next_steps} (contract cho AI); mặc định text mỗi dòng `created:/modified:/next:`.');
  return lines.join('\n');
}
