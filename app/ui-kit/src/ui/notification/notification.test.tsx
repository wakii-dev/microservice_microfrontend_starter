// Notification tests — static API: 4 types, description branch, đóng ×, auto-dismiss,
// DOM API (textContent — nội dung user input KHÔNG bị parse HTML/XSS).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { notification } from './index.js';

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

const lastNote = () => {
  const notes = document.body.querySelectorAll('[role="status"]');
  return notes[notes.length - 1];
};

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

  it.each([
    ['success', 'text-st-done'],
    ['info', 'text-accent'],
    ['warning', 'text-st-doing'],
    ['error', 'text-st-fail'],
  ] as const)('type %s → icon màu trạng thái + aria-hidden', (type, colorCls) => {
    notification[type]('t');
    const icon = lastNote().querySelector('span[aria-hidden]');
    expect(icon?.className).toContain(colorCls);
    expect(icon?.textContent).toBeTruthy();
  });

  it('không description → không render div mô tả (branch omitted)', () => {
    notification.info('Chỉ title');
    const body = lastNote().querySelector('.min-w-0');
    expect(body?.children).toHaveLength(1); // chỉ title
    expect(lastNote().textContent).not.toContain('mt-1');
  });

  it('nút Đóng: aria-label + focus-visible ring chuẩn', () => {
    notification.info('t');
    const btn = lastNote().querySelector('button')!;
    expect(btn).toHaveAttribute('aria-label', 'Đóng');
    expect(btn.className).toContain('focus-visible:ring-2');
  });

  it('XSS: title/description là textContent — không parse HTML', () => {
    notification.error('<img src=x onerror="window.__pwned=1">', '<script>window.__pwned=2</script>');
    const note = lastNote();
    expect(note.querySelector('img')).toBeNull();
    expect(note.querySelector('script')).toBeNull();
    expect(note.textContent).toContain('<img src=x onerror="window.__pwned=1">');
  });

  it('classNames slots (SÓNG-3) — merge sau default ở wrapper/title/content', () => {
    notification.info('slot title', 'slot desc', { wrapper: 'bg-red-50', title: 'uppercase', content: 'p-2' });
    const note = lastNote();
    expect(note).toHaveClass('rounded-xl'); // default giữ
    expect(note).toHaveClass('bg-red-50'); // slot thêm
    const titleEl = note.querySelector('.text-body');
    expect(titleEl).toHaveClass('font-semibold'); // default giữ
    expect(titleEl).toHaveClass('uppercase'); // slot thêm
    const content = note.querySelector('.min-w-0');
    expect(content).toHaveClass('flex-1'); // default giữ
    expect(content).toHaveClass('p-2'); // slot thêm
  });
});
