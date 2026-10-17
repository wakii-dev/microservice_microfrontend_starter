// env.ts — parse + fail-fast env config (conventions/06: 100% env-var, không
// fallback im lặng cho secret). AUTH_DEV_PASSWORD default 'demo-password' là
// CHỦ ĐÍCH theo spec decision #10 (e2e + svc-activity + seed cùng một nguồn —
// không phải secret, giá trị dev fixture được document trong .env.example).
export interface Env {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  accessTokenTtl: string; // duration jsonwebtoken parse được ('30m' — token-contract §1)
  authDevPassword: string; // chỉ seed dùng — login verify với hash đã lưu
  usersFixturePath: string | null; // optional — thiếu = bỏ seed (register vẫn chạy)
  corsDevOrigin: string; // rỗng = deny-by-default (conventions/07)
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const TTL_PATTERN = /^\d+(ms|s|m|h|d)$/;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const missing: string[] = [];
  const need = (name: string): string => {
    const v = source[name];
    if (!v || v.trim() === '') missing.push(name);
    return v ?? '';
  };

  const portRaw = source.PORT;
  const port = Number(portRaw || '8090');
  const databaseUrl = need('DATABASE_URL');
  const jwtSecret = need('JWT_SECRET');
  const accessTokenTtl = need('ACCESS_TOKEN_TTL');
  const logLevelRaw = source.LOG_LEVEL ?? 'info';

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`PORT invalid: "${portRaw}" (conventions/05: auth-svc = 8090)`);
  }
  if (accessTokenTtl && !TTL_PATTERN.test(accessTokenTtl.trim())) {
    throw new Error(`ACCESS_TOKEN_TTL invalid: "${accessTokenTtl}" (dạng duration: 30m | 1800s | 1h — token-contract.md §1)`);
  }
  if (!['debug', 'info', 'warn', 'error'].includes(logLevelRaw)) {
    throw new Error(`LOG_LEVEL invalid: "${logLevelRaw}" (debug|info|warn|error)`);
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')} (platform/.env.example)`);
  }

  return {
    port,
    databaseUrl,
    jwtSecret,
    accessTokenTtl: accessTokenTtl.trim(),
    // decision #10 — default demo-password (seeded fixture users)
    authDevPassword: source.AUTH_DEV_PASSWORD?.trim() || 'demo-password',
    usersFixturePath: source.USERS_FIXTURE_PATH?.trim() || null,
    corsDevOrigin: source.CORS_DEV_ORIGIN ?? '',
    logLevel: logLevelRaw as Env['logLevel'],
  };
}
