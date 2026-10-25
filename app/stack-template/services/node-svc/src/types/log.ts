// log.ts — kiểu hàm log chung (tránh phụ thuộc pino type ở client/infra layer).
export type LogLevelName = 'debug' | 'info' | 'warn' | 'error';
export type LogFn = (level: LogLevelName, msg: string, fields?: Record<string, unknown>) => void;
