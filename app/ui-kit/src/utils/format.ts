// format — util định dạng hiển thị (utils wave 2026-10-18): tiền tệ VND/USD,
// bytes tự đo bậc, thời gian tương đối tiếng Việt, số ngăn cách nghìn vi-VN.
// Thuần function, không dep — Intl chỉ dùng locale chuẩn ('vi-VN'/'en-US') nên
// kết quả deterministic trong test lẫn runtime.

/** Định dạng tiền tệ — VND: '1.234.567 đ' (không số lẻ, đ suffix kiểu vi);
 * USD: '$1,234.50' (en-US, 2 số lẻ). Giá âm giữ dấu trừ đầu. */
export function formatCurrency(value: number, currency: 'VND' | 'USD' = 'VND'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)} đ`;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Định dạng byte tự đo bậc (1024): 0 → '0 B' · 1024 → '1 KB' · 1048576 → '1 MB'
 * · 1536 → '1.5 KB'. Số lẻ chỉ hiện khi cần (tối đa 1 chữ số thập phân). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} ${BYTE_UNITS[unit]}`;
}

/** Thời gian tương đối tiếng Việt so với `now` (mặc định Date.now()): 'vừa xong'
 * (<60s) · '3 phút trước' · '2 giờ trước' · '5 ngày trước' · '3 tuần trước'
 * · '4 tháng trước' · '2 năm trước'. Nhận Date | epoch ms | ISO string. */
export function formatRelativeTime(date: Date | number | string, now: Date | number = Date.now()): string {
  const then = new Date(date).getTime();
  const diffMs = new Date(now).getTime() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} tuần trước`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
}

/** Số ngăn cách nghìn kiểu vi-VN ('.'), mặc định không số lẻ: 1234567 → '1.234.567'.
 * `maximumFractionDigits` cho phép giữ lẻ (vd 3.14). */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(value);
}
