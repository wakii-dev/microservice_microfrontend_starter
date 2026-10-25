// manifest — load + validate stack-manifest.json (nguồn sự thật prune của engine).
//
// ── SCHEMA (hợp đồng với worker-compose — engine KHÔNG biết trước service nào) ──
// {
//   "version": 1,
//   "services": {                              // mọi đơn vị prune được — KEY = tên block compose
//     "node-svc": {
//       "layer": "be",                         // 'core' | 'infra' | 'be' | 'fe'
//       "paths": ["services/node-svc"],        // (tuỳ chọn) đường dẫn trong template xoá khi prune
//       "envKeys": ["NODE_SVC_DB_PASSWORD"],   // (tuỳ chọn) key bỏ khỏi .env.example
//       "gatewayBlocks": ["upstream node_svc"] // (tuỳ chọn) marker khối nginx xoá khi service bị prune
//     },
//     ...
//   },
//   "files": {
//     "compose": "platform/docker-compose.yml",     // bắt buộc
//     "env": "platform/.env.example",               // tuỳ chọn
//     "gatewayConf": "platform/gateway/nginx/nginx.conf", // tuỳ chọn
//   },
//   "ports": { "gateway": "http://localhost:8080", "shell": "http://localhost:3000" }, // (tuỳ chọn) ghi vào README
//   "smoke": "bash scripts/smoke/e2e.sh"       // (tuỳ chọn) lệnh smoke ghi vào README
// }
// Layer phân luồng tier-1: 'be' kéo postgres+kafka+gateway+auth-svc; 'fe' kéo gateway.
// ('core'/'infra' không tự kéo gì — caller chọn trực tiếp.)
import { readFileSync } from 'node:fs';

export const STACK_LAYERS = ['core', 'infra', 'be', 'fe'] as const;
export type StackLayer = (typeof STACK_LAYERS)[number];

export interface StackServiceMeta {
  layer: StackLayer;
  /** Đường dẫn template xoá khi service bị prune (build context, source…). */
  paths?: string[];
  /** Key bỏ khỏi file env khi service bị prune. */
  envKeys?: string[];
  /** Marker khối nginx xoá khỏi gateway conf khi service bị prune. */
  gatewayBlocks?: string[];
}

export interface StackManifest {
  version: number;
  services: Record<string, StackServiceMeta>;
  files: {
    compose: string;
    env?: string;
    gatewayConf?: string;
  };
  /** URL/port ghi vào README sinh ra (vd gateway/shell). */
  ports?: Record<string, string>;
  /** Lệnh smoke ghi vào README. */
  smoke?: string;
}

/** Đọc + validate manifest — lỗi đầu tiên throw message rõ (engine fail-fast). */
export function loadManifest(path: string): StackManifest {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`stack-manifest.json không đọc/parse được tại ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
  return validateManifest(raw, path);
}

/** Validate shape — tách khỏi load để test trúng trực tiếp. */
export function validateManifest(raw: unknown, source = 'manifest'): StackManifest {
  if (typeof raw !== 'object' || raw === null) throw new Error(`${source}: manifest phải là object`);
  const m = raw as Record<string, unknown>;

  if (m.version !== 1) throw new Error(`${source}: version phải là 1`);

  if (typeof m.services !== 'object' || m.services === null || Object.keys(m.services as object).length === 0) {
    throw new Error(`${source}: services phải là object KHÔNG rỗng`);
  }
  const services: Record<string, StackServiceMeta> = {};
  for (const [name, meta] of Object.entries(m.services as Record<string, unknown>)) {
    if (typeof meta !== 'object' || meta === null) throw new Error(`${source}: services.${name} phải là object`);
    const layer = (meta as StackServiceMeta).layer;
    if (!layer || !(STACK_LAYERS as readonly string[]).includes(layer)) {
      throw new Error(`${source}: services.${name}.layer phải thuộc ${STACK_LAYERS.join('|')} — nhận: ${String(layer)}`);
    }
    services[name] = meta as StackServiceMeta;
  }

  if (typeof m.files !== 'object' || m.files === null) throw new Error(`${source}: files phải là object`);
  const files = m.files as Record<string, unknown>;
  if (typeof files.compose !== 'string' || files.compose.length === 0) {
    throw new Error(`${source}: files.compose bắt buộc (đường dẫn docker-compose trong template)`);
  }
  if (files.env !== undefined && typeof files.env !== 'string') throw new Error(`${source}: files.env phải là string`);
  if (files.gatewayConf !== undefined && typeof files.gatewayConf !== 'string') {
    throw new Error(`${source}: files.gatewayConf phải là string`);
  }

  const manifest: StackManifest = { version: 1, services, files: { compose: files.compose as string } };
  if (typeof files.env === 'string') manifest.files.env = files.env;
  if (typeof files.gatewayConf === 'string') manifest.files.gatewayConf = files.gatewayConf;
  if (typeof m.ports === 'object' && m.ports !== null) manifest.ports = m.ports as Record<string, string>;
  if (typeof m.smoke === 'string') manifest.smoke = m.smoke;
  return manifest;
}
