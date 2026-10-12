// env.ts — parse + fail-fast env config (conventions/06: 100% env-var, không
// fallback im lặng cho secret). Compose entry pre-seed (SF-1) inject đủ 7 biến.
export interface Env {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  springSvcUrl: string;
  goSvcUrl: string;
  corsDevOrigin: string; // rỗng = deny-by-default (conventions/07)
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const missing: string[] = [];
  const need = (name: string): string => {
    const v = source[name];
    if (!v || v.trim() === '') missing.push(name);
    return v ?? '';
  };

  const port = Number(need('PORT') || '3001');
  const databaseUrl = need('DATABASE_URL');
  const jwtSecret = need('JWT_SECRET');
  const springSvcUrl = need('SPRING_SVC_URL');
  const goSvcUrl = need('GO_SVC_URL');
  const corsDevOrigin = source.CORS_DEV_ORIGIN ?? '';
  const logLevelRaw = source.LOG_LEVEL ?? 'info';

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`PORT invalid: "${source.PORT}" (conventions/05: node-svc = 3001)`);
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
    springSvcUrl: springSvcUrl.replace(/\/+$/, ''),
    goSvcUrl: goSvcUrl.replace(/\/+$/, ''),
    corsDevOrigin,
    logLevel: logLevelRaw as Env['logLevel'],
  };
}
