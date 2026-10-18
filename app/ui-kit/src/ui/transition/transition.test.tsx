// Transition tests — Fade/Zoom/Collapse: enter/exit class, unmount-on-end
// (animationEnd/transitionEnd từ chính wrapper), giữ DOM khi unmountOnExit=false,
// ignore end-event bắn từ con, Collapse 0fr↔1fr + overflow clip tầng trong.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { Collapse, Fade, Zoom } from './index.js';

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
  it('in=true → gridTemplateRows 1fr; in=false → 0fr + ease-exit; có tầng overflow clip', async () => {
    const user = userEvent.setup();
    render(<Harness Comp={Collapse} />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    const box = screen.getByText('panel').parentElement!.parentElement!;
    expect(box.style.gridTemplateRows).toBe('1fr');
    const clip = screen.getByText('panel').parentElement!;
    expect(clip).toHaveClass('min-h-0', 'overflow-hidden');
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(box.style.gridTemplateRows).toBe('0fr');
    expect(box.style.transitionTimingFunction).toBe('var(--ease-exit)');
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
