// format tests — biên: VND 0, bytes 0/1024/1048576, relative giờ/ngày/tuần/tháng/năm.
import { describe, expect, it } from 'vitest';
import { formatBytes, formatCurrency, formatNumber, formatRelativeTime } from './format.js';

describe('formatCurrency', () => {
  it('VND: 0 → "0 đ"; 1234567 → "1.234.567 đ" (không số lẻ)', () => {
    expect(formatCurrency(0, 'VND')).toBe('0 đ');
    expect(formatCurrency(1234567, 'VND')).toBe('1.234.567 đ');
  });

  it('USD: 1234.5 → "$1,234.50" (en-US 2 số lẻ); âm giữ dấu trừ', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatCurrency(-9, 'USD')).toBe('-$9.00');
  });

  it('mặc định VND khi bỏ tham số', () => {
    expect(formatCurrency(50000)).toBe('50.000 đ');
  });
});

describe('formatBytes', () => {
  it('biên 0 / 1024 / 1048576 → đúng bậc B/KB/MB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('số lẻ 1 chữ số khi không nguyên: 1536 → "1.5 KB"; 1073741824 → "1 GB"', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('giá trị nhỏ giữ nguyên B; âm/bất hợp lệ → "0 B"', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(-5)).toBe('0 B');
  });
});

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-10-18T12:00:00').getTime();

  it('dưới 1 phút → "vừa xong"; phút → "X phút trước"', () => {
    expect(formatRelativeTime(NOW - 30_000, NOW)).toBe('vừa xong');
    expect(formatRelativeTime(NOW - 3 * 60_000, NOW)).toBe('3 phút trước');
  });

  it('giờ / ngày biên 3600s / 86400s', () => {
    expect(formatRelativeTime(NOW - 2 * 3_600_000, NOW)).toBe('2 giờ trước');
    expect(formatRelativeTime(NOW - 86_400_000, NOW)).toBe('1 ngày trước');
  });

  it('tuần / tháng / năm theo mốc 7/30/365 ngày', () => {
    expect(formatRelativeTime(NOW - 14 * 86_400_000, NOW)).toBe('2 tuần trước');
    expect(formatRelativeTime(NOW - 60 * 86_400_000, NOW)).toBe('2 tháng trước');
    expect(formatRelativeTime(NOW - 730 * 86_400_000, NOW)).toBe('2 năm trước');
  });

  it('nhận Date object + ISO string', () => {
    expect(formatRelativeTime(new Date(NOW - 60_000), NOW)).toBe('1 phút trước');
    expect(formatRelativeTime(new Date(NOW - 60_000).toISOString(), NOW)).toBe('1 phút trước');
  });
});

describe('formatNumber', () => {
  it('ngăn cách nghìn vi-VN: 1234567 → "1.234.567"; 0 → "0"', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(0)).toBe('0');
  });

  it('maximumFractionDigits giữ số lẻ khi cần (thập phân vi-VN là dấu phẩy)', () => {
    expect(formatNumber(3.14159, 2)).toBe('3,14');
    expect(formatNumber(3.14159, 3)).toBe('3,142');
  });

  it('số âm giữ dấu trừ; mặc định làm tròn bỏ lẻ (3.9 → "4")', () => {
    expect(formatNumber(-1234)).toBe('-1.234');
    expect(formatNumber(3.9)).toBe('4');
  });
});
