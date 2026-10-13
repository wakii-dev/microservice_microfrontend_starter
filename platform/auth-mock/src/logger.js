// JSON log shape chung — platform/conventions/03-logging.md
// (ts ISO + level STRING — pino mặc định level số + key `time`, sai shape)
import { pino } from 'pino';

export function authMockLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service: 'auth-mock' },
    formatters: {
      level: (label) => ({ level: label }), // "level":"info" thay vì 30
    },
    timestamp: () => `,"ts":"${new Date().toISOString()}"`, // key `ts` thay vì `time`
  });
}
