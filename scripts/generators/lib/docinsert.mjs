// docinsert.mjs — các chèn "văn bản có cấu trúc nhẹ" không phải yaml/nginx:
// dòng bảng markdown (conventions/05) + route JSX vào App.tsx (gen-feature).
// Mỗi hàm tìm ANCHOR ổn định cụ thể của boilerplate; không thấy → null
// (caller đưa vào next_steps chỉ dẫn chèn tay — KHÔNG đoán).

/**
 * Thêm dòng vào bảng port của platform/conventions/05-ports.md — ngay sau dòng
 * postgres (dòng bảng cuối hiện có). Anchor thiếu → null → đưa vào next_steps.
 */
export function appendPortsTableRow(text, name, port, note) {
  const anchor = '| postgres | 5432 | Postgres 16 |';
  if (!text.includes(anchor)) return null;
  return text.replace(anchor + '\n', `${anchor}\n| ${name} | ${port} | ${note} |\n`);
}

/**
 * Chèn route + import Page vào App.tsx react-router declarative
 * (shell + admin + SPA sinh ra đều dùng `<Routes>`).
 * Ưu tiên marker JSX comment "GEN:routes" (app do gen-app sinh có sẵn marker này);
 * fallback chèn TRƯỚC catch-all `<Route path="*"`. Không thấy cả hai → null (caller sinh files
 * + hướng dẫn chèn tay). Throw nếu route đã tồn tại (idempotent-guard).
 */
export function insertAppRoute(text, { routePath, componentName, importLine }) {
  if (text.includes(`path="${routePath}"`)) {
    throw new Error(`route "${routePath}" đã tồn tại trong App.tsx — idempotent-guard`);
  }
  const marker = '{' + '/* GEN:routes */}';
  const hasMarker = text.includes(marker);
  const catchAllIdx = text.indexOf('<Route path="*"');
  if (!hasMarker && catchAllIdx === -1) return null;

  const withImport = appendImport(text, importLine);
  const routeEl = `        <Route path="${routePath}" element={<${componentName} />} />\n`;
  if (hasMarker) {
    const idx = withImport.indexOf(marker) + marker.length;
    return withImport.slice(0, idx) + '\n' + routeEl + withImport.slice(idx);
  }
  // chèn đầu DÒNG catch-all (không phải tại token — giữ indent dòng gốc)
  const tokenAt = withImport.indexOf('<Route path="*"');
  const lineStart = withImport.lastIndexOf('\n', tokenAt) + 1;
  return withImport.slice(0, lineStart) + routeEl + withImport.slice(lineStart);
}

/** Thêm 1 dòng import sau dòng `import ...` cuối cùng của file (khối import đầu file). */
export function appendImport(text, importLine) {
  const lines = text.split('\n');
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import /.test(lines[i])) last = i;
  }
  if (last === -1) return `${importLine}\n${text}`;
  lines.splice(last + 1, 0, importLine);
  return lines.join('\n');
}

/**
 * Thêm exposes entry vào rspack.config.mjs của remote (gen-feature lên app MF
 * không có router): anchor `exposes: {` — chèn đúng thụt lề của entry có sẵn.
 * Không thấy anchor → null.
 */
export function insertRspackExpose(text, { exposedModule, file }) {
  if (text.includes(`'${exposedModule}'`)) {
    throw new Error(`rspack exposes đã có '${exposedModule}' — idempotent-guard`);
  }
  const anchor = 'exposes: {';
  const idx = text.indexOf(anchor);
  if (idx === -1) return null;
  const lineEnd = text.indexOf('\n', idx);
  const firstEntry = text.slice(lineEnd + 1);
  const indentMatch = firstEntry.match(/^[ \t]*/);
  const indent = indentMatch ? indentMatch[0] : '      ';
  const entry = `\n${indent}'${exposedModule}': '${file}',`;
  return text.slice(0, lineEnd) + entry + text.slice(lineEnd);
}
