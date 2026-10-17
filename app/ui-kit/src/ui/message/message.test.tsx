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

describe('message — đầy đủ types + WAAPI path (prod có Element.animate)', () => {
  it('warning + info → toast riêng từng cái', () => {
    message.warning('Token sắp hết hạn');
    message.info('Đã đồng bộ feed');
    const toasts = document.body.querySelectorAll('[role="status"]');
    expect(toasts.length).toBe(2);
    expect(toasts[0].textContent).toContain('Token sắp hết hạn');
    expect(toasts[1].textContent).toContain('Đã đồng bộ feed');
  });

  it('có Element.animate (prod) → enter + exit animation + onfinish remove', () => {
    vi.useFakeTimers();
    // polyfill WAAPI — jsdom thiếu; cover branch animate CÓ MẶT (prod thật)
    const animate = vi.fn((_keyframes?: unknown) => ({ onfinish: () => undefined }));
    // jsdom không có animate — defineProperty (spyOn yêu cầu method tồn tại)
    Object.defineProperty(globalThis.HTMLElement.prototype, 'animate', {
      value: animate,
      configurable: true,
      writable: true,
    });

    message.success('ok');
    // enter animation — keyframes translateY(-12px) → 0
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][0]).toEqual([
      { opacity: 0, transform: 'translateY(-12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ]);

    // auto-dismiss 3s → exit animation fade-out + onfinish → remove
    vi.advanceTimersByTime(3000);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(animate.mock.calls[1][0]).toEqual([{ opacity: 1 }, { opacity: 0 }]);
    // onfinish → el.remove() (thật — toast biến khỏi DOM, không phải mock remove)
    (animate.mock.results[1].value as { onfinish: () => void }).onfinish();
    expect(document.body.querySelector('[role="status"]')).toBeNull();

    vi.useRealTimers();
    delete (globalThis.HTMLElement.prototype as { animate?: unknown }).animate;
  });
});
