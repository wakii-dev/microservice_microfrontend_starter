// Tests format — 4 formatter: giá trị + edge (0, âm, biên unit, tương lai/quá khứ).
import { describe, expect, it } from 'vitest';
import { formatBytes, formatCurrency, formatNumber, formatRelativeTime } from './format.js';

describe('formatCurrency', () => {
  it('mặc định vi-VN/VND, 0 thập phân', () => {
    // Intl vi-VN: nhóm bằng dấu chấm, ký hiệu ₫
    expect(formatCurrency(1234567)).toContain('1.234.567');
    expect(formatCurrency(1234567)).toContain('₫');
  });

  it('locale/currency/decimals tuỳ chỉnh', () => {
    expect(formatCurrency(9.5, { locale: 'en-US', currency: 'USD', decimals: 2 })).toBe('$9.50');
  });
});

describe('formatBytes', () => {
  it('B giữ nguyên; 1024-base sang KB/MB/GB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB');
    expect(formatBytes(2 * 1024 ** 4)).toBe('2.0 TB');
  });

  it('edge: 0 · âm/không hợp lệ → "0 B"; decimals tuỳ chỉnh', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-5)).toBe('0 B');
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(1536, 2)).toBe('1.50 KB');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-24T12:00:00Z');

  it('quá khứ → "x phút trước" (vi-VN, numeric auto)', () => {
    const then = new Date(now.getTime() - 5 * 60_000);
    expect(formatRelativeTime(then, { now })).toBe('5 phút trước');
  });

  it('tương lai → "sau x phút" (vi RTF thêm "sau"); giây → "vài giây trước" (auto)', () => {
    const future = new Date(now.getTime() + 3 * 60_000);
    expect(formatRelativeTime(future, { now })).toBe('sau 3 phút nữa');
    const justNow = new Date(now.getTime() - 2_000);
    expect(formatRelativeTime(justNow, { now })).toContain('giây');
  });

  it('đơn vị lớn: giờ/ngày/tuần đúng ngưỡng', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 2 * 3600_000), { now })).toBe('2 giờ trước');
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 86400_000), { now })).toBe('3 ngày trước');
    expect(formatRelativeTime(new Date(now.getTime() - 2 * 604800_000), { now })).toBe('2 tuần trước');
  });
});

describe('formatNumber', () => {
  it('mặc định vi-VN nhóm chuẩn; decimals; compact ("1,2 Tr" — ICU vi)', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(3.14159, { decimals: 2 })).toBe('3,14');
    expect(formatNumber(1234567, { compact: true })).toBe('1 Tr'); // ICU vi dùng NBSP trước đơn vị
    expect(formatNumber(1234567, { compact: true, decimals: 1 })).toBe('1,2 Tr');
  });
});
