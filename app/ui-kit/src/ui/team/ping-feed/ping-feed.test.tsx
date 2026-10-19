import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PingFeed, relTime } from './index.js';

afterEach(cleanup);

const EVENTS = [
  { at: new Date(Date.now() - 5 * 60000), actor: 'V1', kind: 'milestone' as const, text: 'baseline 14/14 grid' },
  { at: new Date(Date.now() - 90 * 60000), actor: 'W6', kind: 'blocked' as const, text: 'Field required label fail' },
  { at: new Date(Date.now() - 3 * 3600000), actor: 'V2', kind: 'start' as const, text: 'Depth wave 2' },
];

describe('PingFeed', () => {
  it('render events: actor + text + relative time', () => {
    render(<PingFeed events={EVENTS} />);
    expect(screen.getByText('baseline 14/14 grid')).toBeInTheDocument();
    expect(screen.getAllByText('V1').length).toBeGreaterThan(0);
    expect(screen.getByText(/phút trước/)).toBeInTheDocument();
    expect(screen.getAllByText(/giờ trước/).length).toBeGreaterThan(0);
  });

  it('màu theo kind: milestone dot st-done, start dot accent', () => {
    const { container } = render(<PingFeed events={EVENTS} />);
    const dots = [...container.querySelectorAll("li span[style]")].filter((s) => (s as HTMLElement).style.background !== "") as HTMLElement[];
    expect(dots[0].style.background).toContain('--st-done');
    expect(dots[2].style.background).toContain('--accent');
  });

  it('có event blocked → pulse badge role=status hiện; không blocked → ẩn', () => {
    const { rerender } = render(<PingFeed events={EVENTS} />);
    expect(screen.getByRole('status')).toHaveTextContent('blocked');
    rerender(<PingFeed events={[EVENTS[0], EVENTS[2]]} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('stagger mount: item sau delay lớn hơn item trước (30ms bước)', () => {
    const { container } = render(<PingFeed events={EVENTS} />);
    const items = [...container.querySelectorAll('li > div')];
    const d0 = (items[0] as HTMLElement).style.animationDelay;
    const d1 = (items[1] as HTMLElement).style.animationDelay;
    expect(d0).toBe('0ms');
    expect(d1).toBe('30ms');
  });

  it('relTime: <1 phút → vừa xong; giờ/ngày đúng mốc', () => {
    const now = new Date('2026-10-19T10:00:00');
    expect(relTime(new Date('2026-10-19T09:59:40'), now)).toBe('vừa xong');
    expect(relTime(new Date('2026-10-19T09:30:00'), now)).toBe('30 phút trước');
    expect(relTime(new Date('2026-10-19T07:00:00'), now)).toBe('3 giờ trước');
    expect(relTime(new Date('2026-10-17T10:00:00'), now)).toBe('2 ngày trước');
  });
});

describe('PingFeed — idle-alert kind (R0.1)', () => {
  it('idle-alert → label + màu warning (st-doing)', () => {
    render(<PingFeed events={[{ at: new Date(), actor: 'D', kind: 'idle-alert', text: 'Idle 20 phút — R0.1.' }]} />);
    expect(screen.getByText('idle-alert')).toBeInTheDocument();
    expect(screen.getByText('Idle 20 phút — R0.1.')).toBeInTheDocument();
  });
});
