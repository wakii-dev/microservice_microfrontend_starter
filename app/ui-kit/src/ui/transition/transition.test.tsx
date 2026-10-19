// Transition tests — họ 11 loại: enter/exit class, unmount-on-end
// (animationEnd/transitionEnd từ chính wrapper), giữ DOM khi unmountOnExit=false,
// ignore end-event bắn từ con, Collapse 0fr↔1fr (+orientation horizontal),
// Slide/Grow/Flip/Rotate/Blur/Bounce/ScaleSoft exit = reverse enter,
// Stagger delay nối tiếp, Crossfade swap opacity. Depth contract: easing
// mặc định var(--ease-smooth).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { useState, type ComponentType } from 'react';
import {
  Blur,
  Bounce,
  Collapse,
  Crossfade,
  Fade,
  Flip,
  Grow,
  Rotate,
  ScaleSoft,
  Slide,
  Stagger,
  Zoom,
} from './index.js';

afterEach(cleanup);

/** Harness — bấm nút flip `in` (điều khiển như consumer thật). */
function Harness({
  Comp,
  unmountOnExit,
}: {
  Comp: typeof Fade | typeof Zoom | typeof Collapse;
  unmountOnExit?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setShow((s) => !s)}>
        toggle
      </button>
      <Comp in={show} unmountOnExit={unmountOnExit}>
        <div>panel</div>
      </Comp>
    </>
  );
}

describe('Fade', () => {
  it('in=false ban đầu → không render (unmountOnExit mặc định)', () => {
    render(<Fade in={false}><div>panel</div></Fade>);
    expect(screen.queryByText('panel')).toBeNull();
  });

  it('in=true → render + class enter bp-fade-in', async () => {
    const user = userEvent.setup();
    render(<Harness Comp={Fade} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    const box = screen.getByText('panel').parentElement!;
    expect(box.className).toContain('bp-fade-in');
    expect(box.className).not.toContain('bp-fade-out');
  });

  it('in→false → class exit bp-fade-out; animationEnd trên wrapper → unmount', async () => {
    const user = userEvent.setup();
    render(<Harness Comp={Fade} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    const box = screen.getByText('panel').parentElement!;
    expect(box.className).toContain('bp-fade-out');
    fireEvent.animationEnd(box);
    expect(screen.queryByText('panel')).toBeNull();
  });

  it('animationEnd bắn từ CON (bubble) → không unmount', async () => {
    const user = userEvent.setup();
    render(<Harness Comp={Fade} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    fireEvent.animationEnd(screen.getByText('panel'));
    expect(screen.getByText('panel')).toBeInTheDocument();
  });

  it('unmountOnExit=false → in=false vẫn trong DOM, giữ opacity-0', async () => {
    const user = userEvent.setup();
    render(<Harness Comp={Fade} unmountOnExit={false} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    const box = screen.getByText('panel').parentElement!;
    expect(box).toHaveClass('opacity-0');
  });
});

describe('Zoom', () => {
  it('in=true → class enter bp-zoom-in; exit → bp-zoom-out', async () => {
    const user = userEvent.setup();
    render(<Harness Comp={Zoom} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByText('panel').parentElement!.className).toContain('bp-zoom-in');
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByText('panel').parentElement!.className).toContain('bp-zoom-out');
    fireEvent.animationEnd(screen.getByText('panel').parentElement!);
    expect(screen.queryByText('panel')).toBeNull();
  });
});

describe('Collapse', () => {
  it('in=true → gridTemplateRows 1fr; in=false → 0fr + ease-smooth (depth contract); có tầng overflow clip', async () => {
    const user = userEvent.setup();
    render(<Harness Comp={Collapse} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    const box = screen.getByText('panel').parentElement!.parentElement!;
    expect(box.style.gridTemplateRows).toBe('1fr');
    const clip = screen.getByText('panel').parentElement!;
    expect(clip).toHaveClass('min-h-0', 'overflow-hidden');
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(box.style.gridTemplateRows).toBe('0fr');
    expect(box.style.transitionTimingFunction).toBe('var(--ease-smooth)');
  });

  it('exit → transitionEnd → unmount; unmountOnExit=false → giữ DOM', async () => {
    const user = userEvent.setup();
    const once = render(<Harness Comp={Collapse} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    fireEvent.transitionEnd(screen.getByText('panel').parentElement!.parentElement!);
    expect(screen.queryByText('panel')).toBeNull();
    once.unmount();

    render(<Harness Comp={Collapse} unmountOnExit={false} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByText('panel')).toBeInTheDocument();
  });

  it('duration override → transitionDuration ms trên wrapper', async () => {
    render(<Collapse in duration={450}><div>panel</div></Collapse>);
    const box = screen.getByText('panel').parentElement!.parentElement!;
    expect(box.style.transitionDuration).toBe('450ms');
  });
});

describe('Fade — duration override', () => {
  it('duration → animationDuration ms', () => {
    act(() => {
      render(<Fade in duration={300}><div>panel</div></Fade>);
    });
    expect(screen.getByText('panel').parentElement!.style.animationDuration).toBe('300ms');
  });
});

/** Toggle-harness generic cho loại mới (prop riêng truyền qua rest). */
function Toggle({ Comp, props = {} }: { Comp: ComponentType<Record<string, unknown>>; props?: Record<string, unknown> }) {
  const [show, setShow] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setShow((s) => !s)}>flip</button>
      <Comp in={show} {...props}><div>panel</div></Comp>
    </>
  );
}

/** 10 loại mới cùng pattern enter/exit (exit = reverse enter) — 2 test/loại. */
const asGeneric = (C: unknown): ComponentType<Record<string, unknown>> => C as ComponentType<Record<string, unknown>>;
const CASES: [string, ComponentType<Record<string, unknown>>, Record<string, unknown>, string][] = [
  ['Slide up', asGeneric(Slide), { direction: 'up' }, 'bp-slide-up-in'],
  ['Slide down', asGeneric(Slide), { direction: 'down' }, 'bp-slide-in-down'],
  ['Slide left', asGeneric(Slide), { direction: 'left' }, 'bp-slide-in-left'],
  ['Slide right', asGeneric(Slide), { direction: 'right' }, 'bp-slide-in-right'],
  ['Grow', asGeneric(Grow), {}, 'bp-grow-in'],
  ['Flip', asGeneric(Flip), {}, 'bp-flip'],
  ['Rotate', asGeneric(Rotate), {}, 'bp-rotate-in'],
  ['Blur', asGeneric(Blur), {}, 'bp-blur-in'],
  ['Bounce', asGeneric(Bounce), {}, 'bp-bounce-in'],
  ['ScaleSoft', asGeneric(ScaleSoft), {}, 'bp-soft-in'],
];

CASES.forEach(([name, Comp, props, kf]) => {
  describe(name, () => {
    it('enter → class keyframe đúng + easing mặc định ease-smooth', () => {
      render(<Toggle Comp={Comp} props={props} />);
      const box = screen.getByText('panel').parentElement!;
      expect(box.className).toContain(kf);
      expect(box.className).toContain('var(--ease-smooth)');
    });

    it('exit → animationDirection reverse; animationEnd wrapper → unmount; con bubble bỏ qua', () => {
      render(<Toggle Comp={Comp} props={props} />);
      const box = screen.getByText('panel').parentElement!;
      fireEvent.click(screen.getByRole('button', { name: 'flip' }));
      expect(box.style.animationDirection).toBe('reverse');
      fireEvent.animationEnd(screen.getByText('panel')); // bubble từ con — phải bỏ qua
      expect(screen.getByText('panel')).toBeInTheDocument();
      fireEvent.animationEnd(box);
      expect(screen.queryByText('panel')).toBeNull();
    });
  });
});

describe('Slide — prop riêng', () => {
  it('origin của Grow → transformOrigin trên wrapper; delay → animationDelay + fill both', () => {
    render(<Grow in origin="top right" delay={120}><div>panel</div></Grow>);
    const box = screen.getByText('panel').parentElement!;
    expect(box.style.transformOrigin).toBe('top right');
    expect(box.style.animationDelay).toBe('120ms');
    expect(box.style.animationFillMode).toBe('both');
  });
});

describe('Collapse — orientation horizontal (depth contract)', () => {
  it('horizontal → gridTemplateColumns 0fr↔1fr + class transition-columns + clip min-w-0', () => {
    const { rerender } = render(<Collapse in orientation="horizontal"><div>panel</div></Collapse>);
    const box = screen.getByText('panel').parentElement!.parentElement!;
    expect(box.style.gridTemplateColumns).toBe('1fr');
    expect(box.className).toContain('transition-[grid-template-columns]');
    const clip = screen.getByText('panel').parentElement!;
    expect(clip).toHaveClass('min-w-0', 'overflow-hidden');
    rerender(<Collapse in={false} orientation="horizontal" unmountOnExit={false}><div>panel</div></Collapse>);
    expect(box.style.gridTemplateColumns).toBe('0fr');
  });
});

describe('Stagger', () => {
  it('children delay nối tiếp staggerMs (30 mặc định) + animation slide-up-in fill both', () => {
    render(<Stagger in><div>một</div><div>hai</div><div>ba</div></Stagger>);
    const rows = [screen.getByText('một').parentElement!, screen.getByText('hai').parentElement!, screen.getByText('ba').parentElement!];
    // jsdom không tách longhand từ shorthand — assert trên chuỗi animation (regex biên)
    expect(rows[0].style.animation).toMatch(/\s0ms both$/);
    expect(rows[1].style.animation).toMatch(/\s30ms both$/);
    expect(rows[2].style.animation).toMatch(/\s60ms both$/);
    expect(rows[0].style.animation).toContain('bp-slide-up-in');
  });

  it('staggerMs override; exit → container fade-out; animationEnd container → unmount', async () => {
    function StaggerHarness() {
      const [show, setShow] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setShow(false)}>flip</button>
          <Stagger in={show} staggerMs={80}><div>một</div><div>hai</div></Stagger>
        </>
      );
    }
    const user = userEvent.setup();
    render(<StaggerHarness />);
    expect(screen.getByText('hai').parentElement!.style.animation).toMatch(/\s80ms both$/);
    await user.click(screen.getByRole('button', { name: 'flip' }));
    const container = screen.getByText('một').parentElement!.parentElement!;
    expect(container.className).toContain('bp-fade-out');
    fireEvent.animationEnd(container);
    expect(screen.queryByText('một')).toBeNull();
  });

  it('easing prop → timing function trong inline animation của mỗi row', () => {
    render(<Stagger in easing="var(--ease-enter)"><div>một</div></Stagger>);
    expect(screen.getByText('một').parentElement!.style.animation).toContain('var(--ease-enter)');
  });
});

describe('Crossfade', () => {
  it('active=0 → mục 0 hiện, mục 1 opacity-0 + pointer-events-none + aria-hidden', () => {
    render(<Crossfade active={0}><div>mode-a</div><div>mode-b</div></Crossfade>);
    const a = screen.getByText('mode-a').parentElement!;
    const b = screen.getByText('mode-b').parentElement!;
    expect(a).toHaveClass('opacity-100');
    expect(b).toHaveClass('opacity-0', 'pointer-events-none');
    expect(b).toHaveAttribute('aria-hidden', 'true');
    expect(a).not.toHaveAttribute('aria-hidden');
  });

  it('active=1 → swap; cả 2 vẫn mounted (grid chồng cell, không machine)', () => {
    const { rerender } = render(<Crossfade active={0}><div>mode-a</div><div>mode-b</div></Crossfade>);
    rerender(<Crossfade active={1}><div>mode-a</div><div>mode-b</div></Crossfade>);
    expect(screen.getByText('mode-a').parentElement!).toHaveClass('opacity-0');
    expect(screen.getByText('mode-b').parentElement!).toHaveClass('opacity-100');
    expect(screen.getByText('mode-a')).toBeInTheDocument();
  });

  it('duration/easing → inline transition style', () => {
    render(<Crossfade active={0} duration={280} easing="var(--ease-enter)"><div>mode-a</div><div>mode-b</div></Crossfade>);
    const a = screen.getByText('mode-a').parentElement!;
    expect(a.style.transitionDuration).toBe('280ms');
    expect(a.style.transitionTimingFunction).toBe('var(--ease-enter)');
  });
});
