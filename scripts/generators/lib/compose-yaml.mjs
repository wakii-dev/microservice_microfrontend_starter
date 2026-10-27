// compose-yaml.mjs — chèn service vào platform/docker-compose.yml + entry vào
// pnpm-workspace.yaml bằng pkg `yaml` Document API (parseDocument → giữ nguyên
// comment/formatting phần còn lại — KHÔNG regex tay theo yêu cầu mission).
// Chèn service: append pair vào map `services` (cuối map = trước key cấp-1 kế,
// yaml lib tự xử lý indent). Comment gắn commentBefore key node.
import { parseDocument } from 'yaml';

/** Parse + kiểm syntax. Throw với danh sách lỗi nếu YAML hỏng (không đụng file). */
export function loadDoc(text, label = 'yaml') {
  const doc = parseDocument(text);
  if (doc.errors.length > 0) {
    const msgs = doc.errors.map((e) => `${e.name}: ${e.message}`).join('; ');
    throw new Error(`${label} hiện KHÔNG parse được — sửa tay trước khi chạy generator (${msgs})`);
  }
  return doc;
}

function servicesNode(doc) {
  const top = doc.get('services', true);
  if (!top || top.items === undefined) throw new Error('compose thiếu key cấp-1 `services:`');
  return top;
}

function findPair(mapNode, key) {
  return mapNode.items.find((it) => it.key.value === key);
}

/** Key `name` đã có trong services → true (generator từ chối chạy lần 2). */
export function composeHasService(text, name) {
  const doc = loadDoc(text, 'docker-compose.yml');
  return findPair(servicesNode(doc), name) !== undefined;
}

/**
 * Quét TẤT CẢ port host+container khai trong compose (pattern `${VAR:-n}:m` và
 * `n:m`) → Set<number>. Dùng để chọn port trống (conventions/05 — không trùng).
 * Regex chỉ ĐỌC, không chèn — chèn vẫn qua yaml Document API.
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

/** Port trống đầu tiên trong [start..end] — hết khoảng → throw, KHÔNG tự đoán port khác. */
export function pickFreePort(used, start, end) {
  for (let p = start; p <= end; p++) {
    if (!used.has(p)) return p;
  }
  throw new Error(`hết port trống trong khoảng ${start}-${end} — truyền --port thủ công`);
}

/** Node comment gắn trước key service (1 dòng, ngắn — chi tiết để README service). */
function pairWithComment(doc, key, value, comment) {
  const pair = doc.createPair(key, value);
  if (comment) pair.key.commentBefore = comment;
  return pair;
}

/**
 * Chèn service block `name` vào map services. serviceObj là plain object
 * (build/environment/ports/depends_on/healthcheck). Trả text mới.
 * Tồn tại sẵn → throw (idempotent-guard).
 */
export function insertComposeService(text, name, serviceObj, comment) {
  if (composeHasService(text, name)) {
    throw new Error(`compose đã có service "${name}" — generator không chạy đè (idempotent-guard)`);
  }
  const doc = loadDoc(text, 'docker-compose.yml');
  servicesNode(doc).items.push(pairWithComment(doc, name, serviceObj, comment));
  return doc.toString({ lineWidth: 0 });
}

/**
 * Thêm `name` vào `depends_on` của service `host` (gateway health-gated —
 * conventions/02 rule 3: BE = service_healthy; go/distroless = service_started).
 */
export function addServiceDependsOn(text, host, name, condition) {
  const doc = loadDoc(text, 'docker-compose.yml');
  const svcs = servicesNode(doc);
  const hostPair = findPair(svcs, host);
  if (!hostPair) throw new Error(`compose không có service "${host}" — không thêm được depends_on`);
  let deps = hostPair.value.get('depends_on', true);
  if (!deps || deps.items === undefined) {
    deps = doc.createNode({});
    hostPair.value.items.push(doc.createPair('depends_on', deps));
  }
  if (deps.items.some((it) => it.key.value === name)) return text; // đã có — no-op
  deps.items.push(pairWithComment(doc, name, { condition }, 'gen: gate theo readiness service mới'));
  return doc.toString({ lineWidth: 0 });
}

/**
 * Thêm biến env vào environment của service `host` (dùng cho --db: pass
 * `<NAME>_DB_PASSWORD` vào postgres container cho init script tạo role).
 */
export function addServiceEnv(text, host, key, value) {
  const doc = loadDoc(text, 'docker-compose.yml');
  const svcs = servicesNode(doc);
  const hostPair = findPair(svcs, host);
  if (!hostPair) throw new Error(`compose không có service "${host}"`);
  let env = hostPair.value.get('environment', true);
  if (!env || env.items === undefined) {
    env = doc.createNode({});
    hostPair.value.items.push(doc.createPair('environment', env));
  }
  if (env.items.some((it) => it.key.value === key)) return text; // idempotent
  env.items.push(doc.createPair(key, value));
  return doc.toString({ lineWidth: 0 });
}

/**
 * Thêm `- "services/<name>"` vào packages: của pnpm-workspace.yaml (service TS
 * là workspace member — node-svc/auth-svc precedent). Go/Spring không thêm.
 */
export function insertWorkspacePackage(text, pkgPath) {
  const doc = loadDoc(text, 'pnpm-workspace.yaml');
  const seq = doc.get('packages', true);
  if (!seq || seq.items === undefined) throw new Error('pnpm-workspace.yaml thiếu `packages:`');
  if (seq.items.some((it) => it.value === pkgPath || it.value === `"${pkgPath}"`)) return text;
  seq.items.push(doc.createNode(pkgPath));
  return doc.toString({ lineWidth: 0 });
}
