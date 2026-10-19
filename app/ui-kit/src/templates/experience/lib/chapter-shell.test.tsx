// ChapterShell + SideNav tests (SF-3) — contract: section id/data-mood/min-h-screen,
// label mono CHƯƠNG + title ALL-CAPS 29px/300, copy, parallax bg layer, single-source nav.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChapterShell } from './ChapterShell.js';
import { EXPERIENCE_CHAPTERS, SideNav } from './SideNav.js';

afterEach(cleanup);

describe('ChapterShell', () => {
  it('section id + data-mood + min-h-screen + bg-black tự chủ (theme-independent)', () => {
    const { container } = render(
      <ChapterShell id="ch2" chapter="02" mood="docs" title="LIVING DOCS" copy="Tài liệu sống theo task." />,
    );
    const section = container.querySelector('section')!;
    expect(section).toHaveAttribute('id', 'ch2');
    expect(section).toHaveAttribute('data-mood', 'docs');
    expect(section.className).toContain('min-h-screen');
    expect(section.className).toContain('bg-black');
  });

  it('label mono CHƯƠNG + title ALL-CAPS 29px/300 + copy 2 dòng đúng REF-SPEC classes', () => {
    render(
      <ChapterShell id="ch3" chapter="03" mood="velocity" title="Team Velocity" copy="Nhịp_team 24 giờ một vòng." />,
    );
    const label = screen.getByText(/Chương 03/);
    expect(label.className).toContain('font-mono');
    expect(label.className).toContain('tracking-[2.64px]');
    const title = screen.getByRole('heading', { level: 2 });
    expect(title.textContent).toBe('Team Velocity'); // data gốc — ALL-CAPS là CSS
    expect(title.className).toContain('uppercase');
    expect(title.className).toContain('text-[29px]');
    expect(title.className).toContain('font-light');
    expect(screen.getByText(/Nhịp_team/).className).toContain('tracking-[0.3px]');
  });

  it('parallax nền gần-fixed: layer data-chapter-bg trong Parallax (speed 0.08/strength 280 class-less)', () => {
    const { container } = render(
      <ChapterShell id="ch4" chapter="04" mood="ship" title="SHIP" copy="c" />,
    );
    // Parallax render div bọc gradient layer — marker data-chapter-bg để test + a11y ẩn
    expect(container.querySelector('[data-chapter-bg]')).not.toBeNull();
    // gradient dùng scrim tokens (không hex) — assert trong style attribute class
    expect((container.querySelector('[data-chapter-bg]') as HTMLElement).className).toContain('var(--scrim-3)');
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

describe('SideNav (single-source SF-3)', () => {
  it('5 chương #ch1..#ch5, số + title CÙNG flow (items-baseline) — hết 2 layer', () => {
    const { container } = render(<SideNav />);
    const nav = container.querySelector('nav[aria-label="Chương"]')!;
    for (const c of EXPERIENCE_CHAPTERS) {
      expect(nav.querySelectorAll(`a[href="#${c.id}"]`).length).toBe(1);
    }
    const num = Array.from(nav.querySelectorAll('span')).filter((s) => s.textContent === '02');
    expect(num.length).toBe(1);
    expect(num[0].parentElement!.className).toContain('items-baseline');
  });

  it('wrapper fixed pointer-events-none + nav pointer-events-auto (không che chương)', () => {
    const { container } = render(<SideNav />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('pointer-events-none');
    expect(wrapper.className).toContain('fixed');
    const nav = container.querySelector('nav[aria-label="Chương"]') as HTMLElement;
    expect(nav.className).toContain('pointer-events-auto');
  });
});
