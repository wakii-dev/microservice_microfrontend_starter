// ChapterShell + SideNav tests (SF-3) — contract EXPERIENCE-DESIGN v1.0: section
// §6 (id/data-mood/min-h-screen, TRONG SUỐT — MoodBackdrop lo màu), typography §1
// (label mono 11px/700 tracking 2.64 · title 29px/300 leading-snug tracking 0.02em
// · copy 12px leading 1.7 tracking 0.3), parallax §4 (0.08/280 vignette alpha),
// nav single-source single-landmark scroll-spy aria-current 5 mục — glass rail
// (PO redesign 2026-10-19): canvas/70 + blur + hairline phải, dot-nav mobile,
// progress 2px, hover không đổi bg, active accent + translate-x.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChapterShell } from './ChapterShell.js';
import { EXPERIENCE_CHAPTERS, SideNav } from './SideNav.js';

const originalMatchMedia = window.matchMedia;
// jsdom thiếu matchMedia — pattern parallax.test (useMediaQuery cần)
window.matchMedia = vi.fn(() => ({
  matches: false,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as unknown as typeof window.matchMedia;

afterEach(() => {
  cleanup();
  document.body.innerHTML = ''; // mountSection gắn body — dọn để id không trùng giữa test
  vi.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
});

describe('ChapterShell', () => {
  it('section §6: id + data-mood + relative min-h-screen overflow-hidden, KHÔNG nền đục (MoodBackdrop lộ)', () => {
    const { container } = render(
      <ChapterShell id="ch2" chapter="02" mood="docs" title="LIVING DOCS" copy="Tài liệu sống theo task." />,
    );
    const section = container.querySelector('section')!;
    expect(section).toHaveAttribute('id', 'ch2');
    expect(section).toHaveAttribute('data-mood', 'docs');
    expect(section).toHaveAttribute('data-tone', 'dark'); // mặc định — metadata cho SideNav ink
    expect(section.className).toContain('relative');
    expect(section.className).toContain('min-h-screen');
    expect(section.className).toContain('overflow-hidden');
    // Kiến trúc mood SF-1: section trong suốt — KHÔNG tự đặt nền đặc (bg-black/bg-[...])
    expect(section.className).not.toContain('bg-black');
    expect(section.className).not.toContain('bg-[');
  });

  it('typography §1: label mono 11px/700 tracking 2.64 + title 29px/300 leading-snug tracking 0.02em + copy 12px leading 1.7 tracking 0.3', () => {
    render(
      <ChapterShell id="ch3" chapter="03" mood="velocity" title="Team Velocity" copy="Nhịp_team 24 giờ một vòng." />,
    );
    const label = screen.getByText(/Chương 03/);
    expect(label.className).toContain('font-mono');
    expect(label.className).toContain('text-[11px]');
    expect(label.className).toContain('font-bold');
    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('tracking-[2.64px]');
    // REF-SPEC: label nhạt rgb(220,225,236) ≈ white/85 (không white/60 mờ)
    expect(label.className).toContain('text-white/85');

    const title = screen.getByRole('heading', { level: 2 });
    expect(title.textContent).toBe('Team Velocity'); // data gốc — ALL-CAPS là CSS
    expect(title.className).toContain('uppercase');
    expect(title.className).toContain('text-[29px]');
    expect(title.className).toContain('font-light');
    expect(title.className).toContain('leading-snug');
    expect(title.className).toContain('tracking-[0.02em]');
    expect(title.className).toContain('text-white'); // ink heading §2 focus

    const copy = screen.getByText(/Nhịp_team/);
    expect(copy.className).toContain('text-[12px]');
    expect(copy.className).toContain('leading-[1.7]');
    expect(copy.className).toContain('tracking-[0.3px]');
    expect(copy.className).toContain('text-white/92'); // ink body §2
  });

  it('tone light (band sáng mood future) → ink theme-flip đúng bảng ink §2', () => {
    render(<ChapterShell id="ch5" chapter="05" mood="future" title="Future" copy="c" tone="light" />);
    expect(screen.getByRole('heading', { level: 2 }).className).toContain('text-ink');
    expect(screen.getByText(/Chương 05/).className).toContain('text-ink3');
    expect(screen.getByText('c').className).toContain('text-ink2');
    expect(document.getElementById('ch5')).toHaveAttribute('data-tone', 'light');
  });

  it('parallax §4: layer data-chapter-bg trong Parallax speed 0.08/strength 280 — vignette alpha, không gradient mood đục', () => {
    const { container } = render(<ChapterShell id="ch4" chapter="04" mood="ship" title="SHIP" copy="c" />);
    const bg = container.querySelector('[data-chapter-bg]') as HTMLElement;
    expect(bg).not.toBeNull();
    // vignette alpha LOW qua scrim token — crossfade mood phía sau vẫn lộ
    expect(bg.className).toContain('var(--scrim-2)');
    expect(bg.getAttribute('aria-hidden')).toBe('true');
  });

  it('content rail §3: max-w-5xl px-10 (max-md px-6) py-16', () => {
    const { container } = render(<ChapterShell id="ch1" chapter="01" mood="focus" title="F" copy="c" />);
    const rail = container.querySelector('section > div.relative')!;
    expect(rail.className).toContain('max-w-5xl');
    expect(rail.className).toContain('px-10');
    expect(rail.className).toContain('max-md:px-6');
    expect(rail.className).toContain('py-16');
  });

  it('children render bên trong shell (nội dung riêng chương)', () => {
    render(
      <ChapterShell id="ch5" chapter="05" mood="future" title="FUTURE" copy="c">
        <div data-testid="chapter-content">content</div>
      </ChapterShell>,
    );
    expect(screen.getByTestId('chapter-content')).toBeInTheDocument();
  });
});

describe('SideNav (single-source SF-3 — glass rail PO redesign)', () => {
  /** Section stub gắn body với top viewport điều khiển được (pattern anchor.test). */
  function mountSection(id: string, tops: Map<string, number>) {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: tops.get(id) ?? 0,
          bottom: (tops.get(id) ?? 0) + 100,
          left: 0,
          right: 100,
          width: 100,
          height: 100,
          x: 0,
          y: tops.get(id) ?? 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );
    return el;
  }

  it('1 nav landmark duy nhất; 5 chương × 2 variant (rail md+ + dot-nav <768); short label single-source', () => {
    const { container } = render(<SideNav />);
    const navs = container.querySelectorAll('nav');
    expect(navs.length).toBe(1);
    const nav = navs[0]!;
    for (const c of EXPERIENCE_CHAPTERS) {
      // rail desktop + dot-nav mobile — cùng nguồn EXPERIENCE_CHAPTERS
      expect(nav.querySelectorAll(`a[href="#${c.id}"]`).length).toBe(2);
    }
    expect(nav.textContent).toContain('Velocity'); // short label — không title dài
    expect(nav.textContent).not.toContain('Team velocity');
  });

  it('glass rail: canvas/70 + backdrop-blur + hairline phải + progress 2px; dot-nav md:hidden', () => {
    const { container } = render(<SideNav />);
    const glass = Array.from(container.querySelectorAll('div')).filter((d) =>
      d.className.includes('backdrop-blur-md'),
    );
    expect(glass.length).toBe(2); // rail + dot-nav bar
    expect(glass[0]!.className).toContain('border-r'); // hairline phải
    expect(glass[0]!.className).toContain('w-40');
    expect(glass[1]!.className).toContain('border-t');
    expect(container.querySelector('[data-nav-progress]')).not.toBeNull();
    // progress: thanh accent 2px (w-0.5), height % trang
    const progress = container.querySelector('[data-nav-progress]') as HTMLElement;
    expect(progress.className).toContain('bg-accent');
    expect(progress.style.height).toBe('0%'); // jsdom chưa cuộn
    // dot-nav bar ẩn từ md (md:hidden ở wrapper ngoài bar)
    expect(glass[1]!.parentElement!.className).toContain('md:hidden');
  });

  /** Fire scroll + flush rAF (spy throttle rAF — act không tự flush frame).
   * Dispatch trên document: spy listen capture-phase document (scroll thật
   * target document); event dispatch thẳng lên window KHÔNG qua capture đó. */
  async function fireScroll() {
    await act(async () => {
      document.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 25));
    });
  }

  it('item: dot tròn + mono số 11px tracking 2.64 + label ALL-CAPS tracking 2.64; active = accent + translate-x, hover không đổi bg', async () => {
    const tops = new Map<string, number>(EXPERIENCE_CHAPTERS.map((c) => [c.id, 400]));
    for (const c of EXPERIENCE_CHAPTERS) mountSection(c.id, tops);
    const { container } = render(<SideNav />);
    tops.set('ch2', 0);
    await fireScroll();

    const railLabels = container.querySelectorAll('a[href="#ch2"]');
    const railLink = railLabels[0]!; // rail desktop trước dot-nav (thứ tự DOM)
    expect(railLink.className).toContain('translate-x-1'); // active dịch nhẹ
    expect(railLink.getAttribute('aria-current')).toBe('true');
    // active: label accent + dot accent
    const label = railLink.lastElementChild as HTMLElement;
    expect(label.className).toContain('uppercase');
    expect(label.className).toContain('tracking-[2.64px]');
    expect(label.className).toContain('text-accent');
    expect(railLink.querySelector('span')!.className).toContain('bg-accent');
    // inactive: KHÔNG đổi bg hộp (chỉ màu chữ/dot) — không class hover:bg-*
    const inactiveLink = container.querySelector('a[href="#ch1"]')!;
    expect(inactiveLink.className).not.toMatch(/hover:bg/);
    expect(inactiveLink.className).not.toContain('translate-x-1');
  });

  it('scroll-spy đúng 5 mục: aria-current chuyển theo section chạm offsetTop 0 (cả 2 variant)', async () => {
    const tops = new Map<string, number>(
      EXPERIENCE_CHAPTERS.map((c, i) => [c.id, (i + 1) * 400]),
    );
    for (const c of EXPERIENCE_CHAPTERS) mountSection(c.id, tops);
    const { getAllByText } = render(<SideNav />);
    expect(document.querySelector('[aria-current]')).toBeNull();

    const links = (title: string) => getAllByText(title).map((el) => el.closest('a')!);

    tops.set('ch1', 0); // cuộn tới chương 01
    await fireScroll();
    for (const a of links('Focus')) expect(a).toHaveAttribute('aria-current', 'true');

    tops.set('ch3', 0); // cuộn tiếp sang chương 03
    await fireScroll();
    for (const a of links('Focus')) expect(a).not.toHaveAttribute('aria-current');
    for (const a of links('Velocity')) expect(a).toHaveAttribute('aria-current', 'true');

    tops.set('ch5', 0); // cuối trang — chương 05
    await fireScroll();
    for (const a of links('Future')) expect(a).toHaveAttribute('aria-current', 'true');
  });

  it('ink rail = theme token (glass là bề mặt theme): inactive ink2/ink3 + hover ink, active accent — không phụ thuộc mood chương', async () => {
    const tops = new Map<string, number>(EXPERIENCE_CHAPTERS.map((c) => [c.id, 400]));
    for (const c of EXPERIENCE_CHAPTERS) {
      mountSection(c.id, tops);
      if (c.id === 'ch5') document.getElementById(c.id)!.dataset.tone = 'light'; // mood đổi — rail KHÔNG đổi
    }
    const { getAllByText } = render(<SideNav />);

    tops.set('ch1', 0);
    await fireScroll();
    // ch1 active → label nó accent; item inactive dùng theme token
    expect(getAllByText('Focus')[0]!.className).toContain('text-accent');
    const velocityLabel = getAllByText('Velocity')[0]!; // [0] rail — [1] dot-nav
    expect(velocityLabel.className).toContain('text-ink2');
    expect(velocityLabel.className).toContain('group-hover:text-ink');
    expect(velocityLabel.closest('a')!.className).toContain('no-underline'); // preflight tắt

    tops.set('ch5', 0); // band sáng — rail KHÔNG flip theo mood (glass theo theme)
    await fireScroll();
    const velocityAfter = getAllByText('Velocity')[0]!;
    expect(velocityAfter.className).toContain('text-ink2');
    expect(velocityAfter.className).not.toContain('text-accent');
  });

  it('click → preventDefault + scrollIntoView smooth tới section (reduced-motion → auto)', () => {
    const tops = new Map<string, number>(EXPERIENCE_CHAPTERS.map((c) => [c.id, 400]));
    const el = mountSection('ch2', tops);
    // jsdom không define scrollIntoView — gắn mock thẳng lên element
    const scrollIntoView = vi.fn();
    (el as HTMLElement & { scrollIntoView: unknown }).scrollIntoView = scrollIntoView;
    const { getAllByText } = render(<SideNav />);

    let docPrevented: boolean | undefined;
    document.addEventListener('click', (e) => {
      docPrevented = e.defaultPrevented;
    });
    fireEvent.click(getAllByText('Docs')[0]!);
    expect(docPrevented).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
