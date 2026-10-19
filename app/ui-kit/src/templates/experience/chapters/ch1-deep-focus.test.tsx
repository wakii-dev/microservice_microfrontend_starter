// SF-4 — Ch1 Deep Focus tests: ChapterShell contract + CountUp 62.210 vi-VN +
// split-text reveal + focus stack 3 card + CTA anchor + stat strip 4 mini CountUp
// + ghost number nền (PO spec giàu-lớp 5-7 layer).
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Ch1DeepFocus from './ch1-deep-focus.js';

afterEach(cleanup);

describe('Ch1DeepFocus — ChapterShell contract', () => {
  it('section id=ch1 + data-mood=focus + tone dark (contract §6)', () => {
    const { container } = render(<Ch1DeepFocus />);
    const section = container.querySelector('section')!;
    expect(section).toHaveAttribute('id', 'ch1');
    expect(section).toHaveAttribute('data-mood', 'focus');
    expect(section).toHaveAttribute('data-tone', 'dark');
    expect(section.className).toContain('min-h-screen');
  });

  it('CountUp 62.210 format vi-VN chấm nghìn (đích 1.2s ease-out)', async () => {
    render(<Ch1DeepFocus />);
    await waitFor(() => expect(screen.getAllByText('62.210').length).toBeGreaterThan(0), { timeout: 2500 });
  });

  it('ghost số 62.210 mờ nền — aria-hidden, không đếm vào nội dung đọc', () => {
    const { container } = render(<Ch1DeepFocus />);
    const ghost = container.querySelector('[data-ghost-number]')!;
    expect(ghost).not.toBeNull();
    expect(ghost.getAttribute('aria-hidden')).toBe('true');
    expect(ghost.className).toContain('tabular-nums');
  });

  it('split-text reveal: phrase chia từng chữ aria-hidden + aria-label cụm gốc', () => {
    const { container } = render(<Ch1DeepFocus />);
    const split = container.querySelector('[data-split-text]')!;
    expect(split).not.toBeNull();
    expect(split.getAttribute('aria-label')?.length).toBeGreaterThan(5);
    const chars = split.querySelectorAll('[aria-hidden="true"]');
    expect(chars.length).toBeGreaterThanOrEqual(10); // cụm nhiều chữ
  });

  it('focus stack: 3 card (task / timer live / code typing) — mỗi card 1 Parallax riêng', () => {
    const { container } = render(<Ch1DeepFocus />);
    const cards = container.querySelectorAll('[data-focus-card]');
    expect(cards.length).toBe(3);
    // timer card: hiển thị mm:ss live
    const timer = container.querySelector('[data-live-timer]')!;
    expect(timer.textContent).toMatch(/^\d+:\d{2}$/);
    // code card: typing mono + con trỏ nhấp nháy
    const code = container.querySelector('[data-typing-code]')!;
    expect(code.className).toContain('font-mono');
  });

  it('CTA anchor thật sang chương 02 (a11y — button/a thật §6)', () => {
    const { container } = render(<Ch1DeepFocus />);
    const cta = container.querySelector('a[href="#ch2"]')!;
    expect(cta).not.toBeNull();
    expect(cta.className).toContain('uppercase');
  });

  it('stat strip: 4 mini CountUp (data-stat) + label mono uppercase', () => {
    const { container } = render(<Ch1DeepFocus />);
    const stats = container.querySelectorAll('[data-stat]');
    expect(stats.length).toBe(4);
    for (const s of stats) {
      expect(s.querySelector('[data-stat-value]')).not.toBeNull();
      expect(s.querySelector('[data-stat-label]')!.className).toContain('font-mono');
    }
  });

  it('blueprint annotation mono — trang trí aria-hidden (§6 icon decor)', () => {
    const { container } = render(<Ch1DeepFocus />);
    const notes = container.querySelectorAll('[data-blueprint-note]');
    expect(notes.length).toBeGreaterThanOrEqual(2);
    for (const n of notes) expect(n.getAttribute('aria-hidden')).toBe('true');
  });
});
