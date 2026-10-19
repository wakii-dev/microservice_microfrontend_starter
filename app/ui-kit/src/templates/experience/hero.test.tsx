// Hero tests (SF-2) — contract EXPERIENCE-DESIGN v1.0 + PO "giàu lớp": nền atlas tự
// chủ, H1 18px/300 LIGHT uppercase tracking .14em (dòng giữa 29px), eyebrow/label mono
// 2.64, numbered header 01–05, ghost LIGHTYEAR, 4 chip sparkline, scroll hint ring,
// signup live-state, trailer Modal. Số đo khớp REF-SPEC (đo qua style/class).
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Hero from './chapters/hero.js';

afterEach(cleanup);

describe('Hero (SF-2 — atlas nền sáng)', () => {
  it('header id=hero + data-mood=atlas + min-h-screen + nền atlas gradient từ MOOD_STOPS', () => {
    const { container } = render(<Hero />);
    const header = container.querySelector('header')!;
    expect(header).toHaveAttribute('id', 'hero');
    expect(header).toHaveAttribute('data-mood', 'atlas');
    expect(header.className).toContain('min-h-screen');
    // gradient literal DUY NHẤT từ MOOD_STOPS — đúng contract §2 (không hex trùng lặp)
    expect(header.style.background).toContain('165deg');
    expect(header.style.background).toContain('#cdd8f6');
  });

  it('H1 18px/300 LIGHT uppercase tracking 0.14em — dòng giữa 29px lệch khối (REF-SPEC)', () => {
    render(<Hero />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.style.fontSize).toBe('18px');
    expect(h1.style.fontWeight).toBe('300');
    expect(h1.style.textTransform).toBe('uppercase');
    expect(h1.style.letterSpacing).toBe('0.14em');
    expect(h1.style.lineHeight).toBe('1.6');
    expect(h1.style.color).toBe('var(--hero-ink)');
    const mid = screen.getByText('One cinematic');
    expect(mid.className).toContain('text-[29px]'); // LIGHT 300 kế thừa từ style h1
  });

  it('eyebrow mono 11/700 tracking 2.64 + meta mono góc phải (tokens/uuid)', () => {
    render(<Hero />);
    const eyebrow = screen.getByText(/Nền tảng task/i);
    expect(eyebrow.className).toContain('font-mono');
    expect(eyebrow.className).toContain('tracking-[2.64px]');
    const meta = screen.getByText(/orbit 0428\.1/i);
    expect(meta.className).toContain('font-mono');
    expect(meta.className).toContain('tracking-[2.4px]');
  });

  it('ghost LIGHTYEAR khổng lồ mờ nền sau chữ (aria-hidden, opacity 6%)', () => {
    const { container } = render(<Hero />);
    const ghost = container.querySelector('[data-hero-ghost]') as HTMLElement;
    expect(ghost).not.toBeNull();
    expect(ghost.getAttribute('aria-hidden')).toBe('true');
    expect(ghost.textContent).toContain('12.842');
    expect(ghost.className).toContain('opacity-[0.06]');
  });

  it('numbered header 01–05: 5 link #ch1..#ch5 mono tracking 2.64 + mini-nav lặp cùng nguồn', () => {
    const { container } = render(<Hero />);
    const headerNav = container.querySelector('nav[aria-label="Chương (hero)"]')!;
    for (let i = 1; i <= 5; i++) {
      expect(headerNav.querySelectorAll(`a[href="#ch${i}"]`).length).toBe(1);
    }
    const miniNav = container.querySelector('nav[aria-label="Chương (mini-nav)"]')!;
    expect(miniNav.querySelectorAll('a[href="#ch1"]').length).toBe(1);
    // CÙNG nguồn EXPERIENCE_CHAPTERS — số + title cùng dòng
    expect(miniNav.textContent).toContain('01');
    expect(miniNav.textContent).toContain('Deep focus');
  });

  it('4 chip nổi: label mono + số tabular + sparkline (Chart canvas HOẶC fallback MiniSpark)', async () => {
    const { container } = render(<Hero />);
    expect(screen.getByText('Task shipped')).not.toBeNull();
    expect(screen.getByText('+2.4k')).not.toBeNull();
    expect(screen.getByText('99.98%')).not.toBeNull();
    // jsdom: chart.js init fail → fallback MiniSpark svg; browser thật: canvas
    await waitFor(() => {
      const sparks = container.querySelectorAll('svg polyline, canvas');
      expect(sparks.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('scroll hint: progress ring svg + nhãn CUỘN + chevron xoay ngang', () => {
    const { container } = render(<Hero />);
    expect(screen.getByText(/Cuộn/)).not.toBeNull();
    const ring = container.querySelector('svg circle');
    expect(ring).not.toBeNull();
  });

  it('CLICK ◆ ENTER — button thật, click không crash (scrollIntoView feature-detect)', () => {
    render(<Hero />);
    const enter = screen.getByRole('button', { name: /Vào chương 01/i });
    fireEvent.click(enter); // jsdom thiếu scrollIntoView — optional-call phải bỏ qua
  });

  it('signup live-state: nhập email + Gửi → status "Đã ghi nhận"', () => {
    render(<Hero />);
    fireEvent.change(screen.getByLabelText('Email đăng ký'), {
      target: { value: 'hai@orca.vn' },
    });
    fireEvent.click(screen.getByLabelText('Gửi'));
    expect(screen.getByRole('status').textContent).toContain('Đã ghi nhận');
  });

  it('CTA trailer (white box chữ tối) mở Modal role=dialog', async () => {
    render(<Hero />);
    fireEvent.click(screen.getByRole('button', { name: 'Xem trailer' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Trailer — ORCA × WAKII');
  });
});
