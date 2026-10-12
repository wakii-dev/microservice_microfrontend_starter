// JSON log shape chung — platform/conventions/03-logging.md
import { pino } from 'pino';

export function authMockLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service: 'auth-mock' },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
