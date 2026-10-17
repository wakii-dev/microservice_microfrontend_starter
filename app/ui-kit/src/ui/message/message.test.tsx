// Message tests — static API: toast gắn body, auto-remove, role=status.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { message } from './index.js';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('message (static toast)', () => {
  it('success → toast trong body với role=status + nội dung', () => {
    vi.useFakeTimers();
    message.success('Đã xoá task');
    const toast = document.body.querySelector('[role="status"]');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('Đã xoá task');
    vi.useRealTimers();
  });

  it('auto-dismiss sau 3s', () => {
    vi.useFakeTimers();
    message.error('Lỗi rồi');
    expect(document.body.querySelector('[role="status"]')).not.toBeNull();
    vi.advanceTimersByTime(3100);
    // animation onfinish cần thời gian — advance thêm 1 tick
    vi.advanceTimersByTime(200);
    expect(document.body.querySelector('[role="status"]')).toBeNull();
    vi.useRealTimers();
  });
});
