// logger.ts — pino JSON shape chung (conventions/03): ts ISO-8601 UTC ms,
// level, service, msg, requestId. Không console.log — mọi log qua đây.
import pino from 'pino';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function nodeSvcLogger(level: LogLevel = 'info'): pino.Logger {
  return pino({
    level,
    base: { service: 'node-svc' },
    timestamp: () => `,"ts":"${new Date().toISOString()}"`,
    // conventions/03: không log JWT/password toàn phần
    redact: {
      paths: ['authorization', 'req.headers.authorization', 'password', '*.password', 'token', '*.token'],
      censor: '[REDACTED]',
    },
  });
}
