// envfile.mjs — thêm biến env vào platform/.env.example (conventions/06 rule 2:
// inventory ĐẦY ĐỦ, mỗi biến kèm comment 1 dòng). Append section ở cuối file
// (review dễ thấy) — không chèn giữa các section có sẵn để tránh đụng WIP người khác.
import { exists, readText, writeText } from './io.mjs';

/**
 * Append section env mới. Key có sẵn trong file → bỏ qua (không đè giá trị cũ).
 * Trả { added: string[] } — added rỗng = file KHÔNG đổi (caller không được báo modified).
 */
export function appendEnvSection(envPath, { header, vars }) {
  // vars: [{ key, value, comment }]
  if (!exists(envPath)) throw new Error(`không tìm thấy ${envPath}`);
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
