// SF-4 — Ch2 Living Docs tests: ChapterShell contract + 3 feature row xen kẽ +
// mask-reveal clip-path theo useSectionProgress (đo ĐỔI theo scroll) + ảnh graded
// duotone/vignette đúng contract §5.
import { cleanup, fireEvent, render, act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ch2LivingDocs from './ch2-living-docs.js';

afterEach(cleanup);
afterEach(() => vi.restoreAllMocks());

describe('Ch2LivingDocs — ChapterShell contract', () => {
  it('section id=ch2 + data-mood=docs + tone dark (contract §6)', () => {
    const { container } = render(<Ch2LivingDocs />);
    const section = container.querySelector('section')!;
    expect(section).toHaveAttribute('id', 'ch2');
    expect(section).toHaveAttribute('data-mood', 'docs');
    expect(section).toHaveAttribute('data-tone', 'dark');
  });

  it('3 feature row: kicker mono 11px + heading h3 29px/300 + body 12px tracking 0.3', () => {
    const { container } = render(<Ch2LivingDocs />);
    expect(container.querySelectorAll('h3').length).toBe(3);
    expect(container.querySelectorAll('[data-kicker]').length).toBe(3);
    for (const k of container.querySelectorAll('[data-kicker]')) {
      expect(k.className).toContain('font-mono');
      expect(k.className).toContain('tracking-[2.64px]');
    }
    for (const h of container.querySelectorAll('h3')) {
      expect(h.className).toContain('text-[29px]');
      expect(h.className).toContain('font-light');
    }
  });

  it('row xen kẽ trái/phải — row lẻ flip (text md:order-2)', () => {
    const { container } = render(<Ch2LivingDocs />);
    const rows = container.querySelectorAll('[data-feature-row]');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelector('[data-mask-frame]')!.className).not.toContain('md:order-1');
    expect(rows[1].querySelector('[data-mask-frame]')!.className).toContain('md:order-1');
    expect(rows[2].querySelector('[data-mask-frame]')!.className).not.toContain('md:order-1');
  });

  it('mask-reveal: clip-path inset render + ĐỔI theo scroll (useSectionProgress)', async () => {
    const { container } = render(<Ch2LivingDocs />);
    const frame = container.querySelector('[data-mask-frame]') as HTMLElement;
    expect(frame.style.clipPath).toContain('inset(');
    const before = frame.style.clipPath;
    // stub rect: frame đang luvà nửa viewport dưới → progress ~0.35
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({
      top: 500, bottom: 900, height: 400, width: 400, x: 0, y: 500, left: 0, right: 400, toJSON: () => ({}),
    } as DOMRect);
    fireEvent.scroll(document);
    await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))); });
    await waitFor(() => expect(frame.style.clipPath).not.toBe(before), { timeout: 1500 });
  });

  it('ảnh graded contract §5: grayscale + duotone multiply TRONG wrapper clip + vignette scrim-2', () => {
    const { container } = render(<Ch2LivingDocs />);
    const frames = container.querySelectorAll('[data-mask-frame]');
    expect(frames.length).toBe(3);
    for (const frame of frames) {
      const img = frame.querySelector('img')!;
      expect(img.className).toContain('grayscale');
      const duotone = frame.querySelector('[data-duotone]')!;
      expect(duotone.className).toContain('mix-blend-multiply');
      expect(duotone.className).toContain('to-st-done/20');
      // vignette nằm NGOÀI clip (frame effect trên card)
      const vignette = frame.parentElement!.querySelector('[data-vignette]')!;
      expect(vignette.className).toContain('var(--scrim-2)');
    }
  });
});
