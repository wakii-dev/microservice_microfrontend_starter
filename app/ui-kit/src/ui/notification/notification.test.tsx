// Notification tests — static API: container góc phải, đóng ×, auto-dismiss 4.5s.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { notification } from './index.js';

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('notification (static)', () => {
  it('error với title + description → góc phải body', () => {
    notification.error('Đồng bộ thất bại', 'node-svc không phản hồi');
    const note = document.body.querySelector('[role="status"]');
    expect(note?.textContent).toContain('Đồng bộ thất bại');
    expect(note?.textContent).toContain('node-svc không phản hồi');
  });

  it('nút Đóng → remove; auto-dismiss 4.5s', () => {
    vi.useFakeTimers();
    notification.success('Thành công');
    const note = document.body.querySelector('[role="status"]')!;
    (note.querySelector('button') as HTMLButtonElement).click();
    expect(document.body.querySelector('[role="status"]')).toBeNull();
    // auto-dismiss branch: tạo lại rồi advance
    notification.success('Thành công 2');
    vi.advanceTimersByTime(4600);
    expect(document.body.querySelector('[role="status"]')).toBeNull();
  });
});
