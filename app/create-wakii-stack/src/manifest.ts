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
  /** Service bắt buộc kèm theo (closure — chọn A kéo requires(A) đệ quy). */
  requires?: string[];
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

/** Validate shape — tách khỏi load để test trúng trực tiếp.
 * Chấp nhận 2 dạng services: object-map {name: {layer,...}} (fixture test) và
 * LIST [{id, type, paths, envKeys, gatewayBlocks, ...}] — dạng thật của
 * app/stack-template/stack-manifest.json (worker-compose M#8: type thay layer,
 * kèm fields mở rộng requires/rules/groups engine chưa dùng — bỏ qua an toàn).
 * files optional — default theo layout template thật khi thiếu. */
export function validateManifest(raw: unknown, source = 'manifest'): StackManifest {
  if (typeof raw !== 'object' || raw === null) throw new Error(`${source}: manifest phải là object`);
  const m = raw as Record<string, unknown>;

  if (m.version !== 1) throw new Error(`${source}: version phải là 1`);

  const services: Record<string, StackServiceMeta> = {};
  const rawServices = m.services;
  if (Array.isArray(rawServices)) {
    for (const item of rawServices) {
      if (typeof item !== 'object' || item === null) throw new Error(`${source}: services[] item phải là object`);
      const e = item as Record<string, unknown>;
      const name = typeof e.id === 'string' ? e.id : undefined;
      // 'fe-no-compose' (admin — M#8) quy về 'fe'; composeService null engine
      // tự bỏ qua khi service không có khối compose.
      const rawLayer = e.type ?? e.layer;
      const layer = rawLayer === 'fe-no-compose' ? 'fe' : rawLayer;
      if (!name) throw new Error(`${source}: services[].id bắt buộc`);
      if (typeof layer !== 'string' || !(STACK_LAYERS as readonly string[]).includes(layer)) {
        throw new Error(`${source}: services.${name} layer (type) phải thuộc ${STACK_LAYERS.join('|')} — nhận: ${String(layer)}`);
      }
      services[name] = {
        layer: layer as StackLayer,
        ...(Array.isArray(e.paths) ? { paths: e.paths as string[] } : {}),
        ...(Array.isArray(e.envKeys) ? { envKeys: e.envKeys as string[] } : {}),
        ...(Array.isArray(e.gatewayBlocks) ? { gatewayBlocks: e.gatewayBlocks as string[] } : {}),
        ...(Array.isArray(e.requires) ? { requires: e.requires as string[] } : {}),
      };
    }
  } else if (typeof rawServices === 'object' && rawServices !== null) {
    for (const [name, meta] of Object.entries(rawServices as Record<string, unknown>)) {
      if (typeof meta !== 'object' || meta === null) throw new Error(`${source}: services.${name} phải là object`);
      const layer = (meta as StackServiceMeta).layer;
      if (!layer || !(STACK_LAYERS as readonly string[]).includes(layer)) {
        throw new Error(`${source}: services.${name}.layer phải thuộc ${STACK_LAYERS.join('|')} — nhận: ${String(layer)}`);
      }
      services[name] = meta as StackServiceMeta;
    }
  } else {
    throw new Error(`${source}: services phải là object KHÔNG rỗng hoặc array`);
  }
  if (Object.keys(services).length === 0) throw new Error(`${source}: services không được rỗng`);

  // files optional — default layout template thật (manifest M#8 không khai files)
  const filesRaw = (typeof m.files === 'object' && m.files !== null ? m.files : {}) as Record<string, unknown>;
  if (filesRaw.compose !== undefined && typeof filesRaw.compose !== 'string') {
    throw new Error(`${source}: files.compose phải là string`);
  }
  if (filesRaw.env !== undefined && typeof filesRaw.env !== 'string') throw new Error(`${source}: files.env phải là string`);
  if (filesRaw.gatewayConf !== undefined && typeof filesConfRaw(filesRaw) !== 'string') {
    throw new Error(`${source}: files.gatewayConf phải là string`);
  }
  const files = {
    compose: (filesRaw.compose as string) ?? 'platform/docker-compose.yml',
    env: (filesRaw.env as string) ?? 'platform/.env.example',
    gatewayConf: (filesRaw.gatewayConf as string) ?? 'platform/gateway/nginx/nginx.conf',
  };

  const manifest: StackManifest = { version: 1, services, files };
  if (typeof m.ports === 'object' && m.ports !== null) manifest.ports = m.ports as Record<string, string>;
  if (typeof m.smoke === 'string') manifest.smoke = m.smoke;
  return manifest;
}

function filesConfRaw(files: Record<string, unknown>): unknown {
  return files.gatewayConf;
}
