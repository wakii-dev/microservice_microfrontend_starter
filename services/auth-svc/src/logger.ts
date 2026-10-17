// logger.ts — pino JSON shape chung (conventions/03): ts ISO-8601 UTC ms,
// level, service, msg, requestId. Không console.log — mọi log qua đây.
// REDACT MỞ RỘNG cho auth: password + refreshToken tuyệt đối không vào log
// (spec slice SF-2: "KHÔNG log password/refresh").
import pino from 'pino';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function authSvcLogger(level: LogLevel = 'info'): pino.Logger {
  return pino({
    level,
    base: { service: 'auth-svc' },
    timestamp: () => `,"ts":"${new Date().toISOString()}"`,
    // conventions/03 + token-contract: không log JWT/password/refresh token
    redact: {
      paths: [
        'authorization',
        'req.headers.authorization',
        'password',
        '*.password',
        'token',
        '*.token',
        'refreshToken',
        '*.refreshToken',
        'refresh_token',
        '*.refresh_token',
      ],
      censor: '[REDACTED]',
    },
  });
}
