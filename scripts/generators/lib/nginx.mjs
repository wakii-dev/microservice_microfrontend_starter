// nginx.mjs — chèn location vào platform/gateway/nginx/nginx.conf.
// nginx không phải yaml → chèn bằng marker comment `# >>> GEN:*` (mission chỉ định)
// quanh một anchor ổn định của conf hiện tại. Lần chạy đầu TẠO cặp marker tại
// anchor; các lần sau chèn trong vùng marker. Không thấy marker lẫn anchor → null.
import { insertIntoMarkers } from './io.mjs';

// Anchor cho block location API: đứng ngay TRƯỚC phần 401 envelope (conf gốc
// có comment này — conventions/04). Marker GEN:services sẽ được tạo tại đây.
export const API_ANCHOR = '# ---------- 401 body theo error envelope chung (conventions/04) ----------';
export const API_MARKERS = { open: '# >>> GEN:services (scripts/generators — auto, đừng sửa tay trong vùng này)', close: '        # <<< GEN:services' };
// Anchor cho map $remote_up: dòng default trỏ shell (conf gốc conventions/08).
export const REMOTE_ANCHOR = '"http://shell:3000";';
export const REMOTE_MARKERS = { open: '# >>> GEN:remotes (scripts/generators — auto, đừng sửa tay trong vùng này)', close: '        # <<< GEN:remotes' };

/**
 * Location block cho API service (conventions/08): pass-through (proxy_pass KHÔNG
 * URI part), lazy DNS qua biến + resolver, presence-check 401 khi auth=true.
 * Body lỗi 401 dùng chung @unauthorized của conf (envelope conventions/04).
 */
export function apiLocationBlock(name, port, { auth = true } = {}) {
  const guard = auth
    ? '            if ($http_authorization = "") { return 401; }\n'
    : '            # mở — entry công khai (login/health), conventions/08\n';
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
  // thụt theo style map $remote_up hiện có (8 space + regex + pad + quoted upstream)
  return `        ~^/remotes/${name}/    "http://remote-${name}:${port}";\n`;
}

export function hasApiLocation(text, name) {
  return text.includes(`location /api/${name}/`);
}

/**
 * Chèn (hoặc bỏ qua nếu đã có) location block cho API service.
 * Trả { text, createdMarkers } hoặc null (không tìm thấy marker lẫn anchor).
 */
export function insertApiLocation(text, name, port, opts = {}) {
  if (hasApiLocation(text, name)) {
    throw new Error(`nginx.conf đã route /api/${name} — generator không chạy đè (idempotent-guard)`);
  }
  const res = insertIntoMarkers(text, {
    ...API_MARKERS,
    anchor: API_ANCHOR,
    content: apiLocationBlock(name, port, opts),
  });
  return res;
}

/** Chèn dòng map $remote_up cho FE remote static (strip-prefix chung /remotes/ đã có). */
export function insertRemoteMapLine(text, name, port) {
  if (text.includes(`~^/remotes/${name}/`)) {
    throw new Error(`nginx.conf đã map /remotes/${name} — idempotent-guard`);
  }
  // anchor nằm GIỮA dòng (`default   "http://shell:3000";`) — phải chèn trước
  // ĐẦU DÒNG, không chèn giữa `default` và giá trị (sẽ sinh conf hỏng).
  const idx = text.indexOf(REMOTE_ANCHOR);
  if (idx === -1) return null;
  const lineStart = text.lastIndexOf('\n', idx) + 1;
  const lineEnd = text.indexOf('\n', idx);
  const line = lineEnd === -1 ? text.slice(lineStart) : text.slice(lineStart, lineEnd);
  return insertIntoMarkers(text, { ...REMOTE_MARKERS, anchor: line + '\n', content: remoteMapLine(name, port) });
}
