// format — formatter dùng chung (vi-VN mặc định, Intl): tiền tệ · byte ·
// thời gian tương đối · số. NHẤT QUÁN với formatSize trong ui/upload (1024-base,
// 1 thập phân cho KB/MB) — bản này mở rộng đủ GB/TB + tùy chọn decimals.
// 0 deps; SSR an toàn (Intl có trong Node 18+).

export interface FormatCurrencyOptions {
  /** BCP 47 locale — mặc định 'vi-VN'. */
  locale?: string;
  /** Mã tiền ISO 4217 — mặc định 'VND'. */
  currency?: string;
  /** Số chữ số thập phân — mặc định 0 (VND không dùng xu). */
  decimals?: number;
}

/** Định dạng tiền: formatCurrency(1234567) → "1.234.567 ₫" (vi-VN/VND). */
export function formatCurrency(value: number, options: FormatCurrencyOptions = {}): string {
  const { locale = 'vi-VN', currency = 'VND', decimals = 0 } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Định dạng byte (1024-base, 1 thập phân từ KB — khớp formatSize upload):
 * formatBytes(1536) → "1.5 KB". */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `0 ${BYTE_UNITS[0]}`;
  if (bytes < 1024) return `${Math.round(bytes)} ${BYTE_UNITS[0]}`;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(decimals)} ${BYTE_UNITS[unit]}`;
}

const RELATIVE_UNITS: Array<{ limit: number; div: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { limit: 60, div: 1, unit: 'second' },
  { limit: 3600, div: 60, unit: 'minute' },
  { limit: 86400, div: 3600, unit: 'hour' },
  { limit: 604800, div: 86400, unit: 'day' },
  { limit: 2629800, div: 604800, unit: 'week' },
  { limit: 31557600, div: 2629800, unit: 'month' },
  { limit: Infinity, div: 31557600, unit: 'year' },
];

/** Thời gian tương đối (Intl.RelativeTimeFormat): formatRelativeTime(Date.now() -
 * 5 * 60_000) → "5 phút trước"; tương lai → "in 5 minutes" (en) / "5 phút nữa" (vi). */
export function formatRelativeTime(date: Date | number | string, options: { locale?: string; now?: Date | number } = {}): string {
  const { locale = 'vi-VN', now = Date.now() } = options;
  const then = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diffSeconds = Math.round((new Date(now).getTime() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diffSeconds);
  const found = RELATIVE_UNITS.find((u) => abs < u.limit) ?? RELATIVE_UNITS[RELATIVE_UNITS.length - 1]!;
  return rtf.format(-Math.round(diffSeconds / found.div), found.unit);
}

export interface FormatNumberOptions {
  /** BCP 47 locale — mặc định 'vi-VN'. */
  locale?: string;
  /** Số chữ số thập phân — mặc định 0. */
  decimals?: number;
  /** Nén nhóm (1.2K · 3.4M) — dùng notation 'compact'. */
  compact?: boolean;
}

/** Định dạng số: formatNumber(1234567) → "1.234.567"; compact → "1,2 tr" (vi). */
export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const { locale = 'vi-VN', decimals = 0, compact = false } = options;
  return new Intl.NumberFormat(locale, {
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
