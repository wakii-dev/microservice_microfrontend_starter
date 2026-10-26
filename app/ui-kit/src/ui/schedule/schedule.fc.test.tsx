// Schedule — FC THẬT (devDeps đã cài, KHÔNG mock): render thật dayGridMonth.
// Tách file khỏi schedule.test.tsx vì vi.mock ở đó hoist cấp file.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Schedule } from './index.js';

afterEach(cleanup);

const EVENTS = [
  { id: 't1', title: 'Task Alpha', start: '2026-10-18' },
  { id: 't2', title: 'Task Beta', start: '2026-10-20' },
];

describe('Schedule — FullCalendar thật', () => {
  it('render calendar + event title hiện trong grid', async () => {
    const { container } = render(<Schedule events={EVENTS} />);
    await screen.findByText('Task Alpha', {}, { timeout: 5000 });
    expect(container.querySelector('.bp-schedule.fc')).not.toBeNull();
    expect(container.querySelector('.fc-daygrid-day-frame')).not.toBeNull();
    expect(screen.getByText('Task Beta')).toBeInTheDocument();
  });

  it('className passthrough lên root .bp-schedule', () => {
    const { container } = render(<Schedule events={EVENTS} className="marker" />);
    expect(container.querySelector('.bp-schedule')).toHaveClass('marker');
  });

  it('onEventClick bắn đúng id khi click event', async () => {
    const onEventClick = vi.fn();
    const user = userEvent.setup();
    render(<Schedule events={EVENTS} onEventClick={onEventClick} />);
    await user.click(await screen.findByText('Task Alpha', {}, { timeout: 5000 }));
    expect(onEventClick).toHaveBeenCalledWith('t1');
  });

  it('events rỗng → calendar vẫn render (không event)', async () => {
    const { container } = render(<Schedule events={[]} />);
    await waitFor(() => expect(container.querySelector('.fc-daygrid-body')).not.toBeNull(), { timeout: 5000 });
    expect(container.querySelector('.fc-event')).toBeNull();
  });
});

describe('Schedule — skin smoke (FC_SKIN_CSS + height ổn định)', () => {
  it('skin CSS inject 1 lần với data-bp-fc-a11y + chứa rule token chính', async () => {
    render(<Schedule events={EVENTS} />);
    await screen.findByText('Task Alpha', {}, { timeout: 5000 });
    const style = document.querySelector('style[data-bp-fc-a11y]');
    expect(style).not.toBeNull();
    const css = style!.textContent ?? '';
    expect(css).toContain('.bp-schedule.fc{--fc-page-bg-color:var(--c-s2)');
    expect(css).toContain('.bp-schedule.fc .fc-toolbar-title{font-size:var(--fs-h3,15px);font-weight:600');
    expect(css).toContain('.bp-schedule.fc .fc-button{height:2rem');
    expect(css).toContain('.fc-button:focus-visible');
    expect(css).toContain('.fc-day-other'); // a11y adjacent-month rule vẫn đi cùng
    // idempotent — không inject trùng
    expect(document.querySelectorAll('style[data-bp-fc-a11y]')).toHaveLength(1);
  });

  it('toolbar render theo skin: title + cụm nút prev/today/next (snapshot class wrapper)', async () => {
    const { container } = render(<Schedule events={EVENTS} />);
    await screen.findByText('Task Alpha', {}, { timeout: 5000 });
    const wrapper = container.querySelector('.bp-schedule.fc')!;
    // snapshot class wrapper sau skin (FC gắn thêm fc-media-screen/direction-ltr/theme-standard/liquid-hack)
    expect(wrapper.className).toMatchInlineSnapshot('"bp-schedule fc fc-media-screen fc-direction-ltr fc-theme-standard fc-liquid-hack"');
    const toolbar = wrapper.querySelector('.fc-toolbar.fc-header-toolbar')!;
    expect(toolbar).not.toBeNull();
    expect(wrapper.querySelector('.fc-toolbar-title')!.textContent).not.toBe('');
    const buttons = Array.from(wrapper.querySelectorAll('.fc-button'));
    const labels = buttons.map((b) => b.textContent?.trim() ?? '');
    expect(labels.some((l) => /today/i.test(l))).toBe(true);
    expect(buttons.length).toBeGreaterThanOrEqual(3); // prev/today/next (+ view group)
    // prev/next là icon-only → FC v6 gắn accessible name qua `title` ("Previous month")
    const iconBtn = buttons.find((b) => b.classList.contains('fc-prev-button'));
    expect(iconBtn?.getAttribute('title') ?? iconBtn?.getAttribute('aria-label')).toBeTruthy();
  });

  it('height mặc định 650 → inline style trên root; height prop → theo prop', async () => {
    const { container, unmount } = render(<Schedule events={EVENTS} />);
    // jsdom (nwsapi) cache kết quả querySelector: '.fc' poll lần đầu trước khi FC gắn class
    // → cache âm không bao giờ recover (mutation class không invalidate). FC đặt class 'fc'
    // + inline height trên CHÍNH root element → query '.bp-schedule' + đọc classList/style trực tiếp.
    const root = () => container.querySelector<HTMLElement>('.bp-schedule');
    await waitFor(
      () => {
        expect(root()?.classList.contains('fc')).toBe(true);
        expect(root()?.style.height).toBe('650px');
      },
      { timeout: 5000 },
    );
    unmount();
    const { container: c2 } = render(<Schedule events={EVENTS} height={520} />);
    await waitFor(() => expect(c2.querySelector<HTMLElement>('.bp-schedule')?.style.height).toBe('520px'), { timeout: 5000 });
  });
});

// ── slots-wave: classNames slot + style passthrough ──

describe('Schedule — classNames + style', () => {
  it('slot root lên div .bp-schedule.fc; className sau slot', async () => {
    const { container } = render(
      <Schedule events={EVENTS} classNames={{ root: 'slot-root' }} className="user-last" />,
    );
    await screen.findByText('Task Alpha', {}, { timeout: 4000 }); // FC mount xong (.fc đã gắn)
    const root = container.querySelector('.bp-schedule')!;
    expect(root).toHaveClass('slot-root', 'fc');
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
  });

  it('style passthrough lên div gốc (FC vẫn set height riêng của nó)', async () => {
    const { container } = render(<Schedule events={EVENTS} height={520} style={{ margin: '8px' }} />);
    await waitFor(() => expect(container.querySelector<HTMLElement>('.bp-schedule')?.style.height).toBe('520px'), {
      timeout: 5000,
    });
    expect(container.querySelector<HTMLElement>('.bp-schedule')).toHaveStyle({ margin: '8px' });
  });
});
