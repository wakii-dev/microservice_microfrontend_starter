import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Timeline } from './index.js';
afterEach(cleanup);
describe('Timeline', () => {
  it('items + label + rail', () => {
    render(<Timeline items={[
      { key: '1', children: 'Bước 1' },
      { key: '2', color: 'var(--st-done)', children: 'Bước 2', label: '10:00' },
    ]} />);
    expect(screen.getByText('Bước 1')).toBeInTheDocument();
    expect(screen.getByText('Bước 2')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('color → dot nhận background inline; dot aria-hidden (trang trí)', () => {
    render(<Timeline items={[{ key: '1', color: 'var(--st-done)', children: 'X' }]} />);
    const dot = document.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveStyle({ background: 'var(--st-done)' });
  });

  it('không color → dot có class bg-accent mặc định', () => {
    render(<Timeline items={[{ key: '1', children: 'Y' }]} />);
    expect(document.querySelector('span[aria-hidden="true"]')).toHaveClass('bg-accent');
  });

  it('items rỗng → ol rỗng, không crash', () => {
    const { container } = render(<Timeline items={[]} />);
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(container.querySelector('li')).toBeNull();
  });

  it('label render trong li sau children (text-label)', () => {
    render(<Timeline items={[{ key: '1', children: 'Việc', label: '11:00' }]} />);
    const label = screen.getByText('11:00');
    expect(label).toHaveClass('text-label');
    expect(label).toHaveClass('text-ink3');
  });

  it('className passthrough lên ol; node cuối không có rail (before:)', () => {
    const { container } = render(
      <Timeline className="marker" items={[
        { key: '1', children: 'A' },
        { key: '2', children: 'B' },
      ]} />,
    );
    const ol = container.querySelector('ol');
    expect(ol).toHaveClass('marker');
    const lis = container.querySelectorAll('li');
    expect(lis[0].className).toContain('before:absolute');
    expect(lis[1].className).not.toContain('before:absolute');
  });
});

// ── Case-coverage audit 2026-10-18 (antd parity: mode + pending) ──

describe('Timeline — mode (antd parity)', () => {
  const MODE_ITEMS = [
    { key: '1', children: 'Sprint started', label: 'Mon 09:00' },
    { key: '2', children: 'Mid review', label: 'Wed 14:00' },
  ];

  it('mode alternate: grid 3 cột; even label trái, odd content trái', () => {
    const { container } = render(<Timeline mode="alternate" items={MODE_ITEMS} />);
    const lis = container.querySelectorAll('li');
    expect(lis).toHaveLength(2);
    expect(lis[0]).toHaveClass('grid-cols-[1fr_auto_1fr]');
    // even (i=0): cột trái = label, text-right; cột phải = children
    expect(lis[0].children[0]).toHaveTextContent('Mon 09:00');
    expect(lis[0].children[0]).toHaveClass('text-right');
    expect(lis[0].children[2]).toHaveTextContent('Sprint started');
    // odd (i=1): cột trái = children; cột phải = label
    expect(lis[1].children[0]).toHaveTextContent('Mid review');
    expect(lis[1].children[2]).toHaveTextContent('Wed 14:00');
  });

  it('mode left: label LUÔN ở cột trái với mọi item', () => {
    const { container } = render(<Timeline mode="left" items={MODE_ITEMS} />);
    const lis = container.querySelectorAll('li');
    expect(lis[0].children[0]).toHaveTextContent('Mon 09:00');
    expect(lis[1].children[0]).toHaveTextContent('Wed 14:00');
    expect(lis[1].children[2]).toHaveTextContent('Mid review');
  });

  it('mode set: node cuối thật vẫn vẽ rail khi có pending', () => {
    const { container } = render(
      <Timeline mode="left" items={MODE_ITEMS} pending={<>loading…</>} />,
    );
    const lis = container.querySelectorAll('li');
    expect(lis).toHaveLength(3); // 2 items + pending
    expect(lis[1].querySelector('span')!.className).toContain('before:absolute');
  });
});

describe('Timeline — pending (antd parity)', () => {
  it('pending: item cuối dot rỗng border-line + node pending render; item cuối items có rail', () => {
    const { container } = render(
      <Timeline
        items={[
          { key: '1', children: 'Deploy finished' },
          { key: '2', children: 'Smoke green' },
        ]}
        pending={<>Rolling out…</>}
      />,
    );
    const lis = container.querySelectorAll('li');
    expect(lis).toHaveLength(3);
    // item cuối items (i=1) có rail nối xuống pending
    expect(lis[1].className).toContain('before:absolute');
    // pending dot: rỗng — border-line + bg-s2 (không accent)
    const pendingDot = lis[2].querySelector('span')!;
    expect(pendingDot).toHaveClass('border-2', 'border-line', 'bg-s2');
    expect(lis[2]).toHaveTextContent('Rolling out…');
  });
});

describe('Timeline — customize (slots wave 3)', () => {
  const ITEMS = [
    { key: 'a', children: 'Nội dung A', label: '10:00' },
    { key: 'b', children: 'Nội dung B', label: '11:00' },
  ];

  it('classNames slots đúng element (default): root → ol, item → li, dot → span, label → span time', () => {
    const { container } = render(
      <Timeline items={ITEMS} classNames={{ root: 'my-root', item: 'my-item', dot: 'my-dot', label: 'my-label' }} />,
    );
    const ol = container.querySelector('ol') as HTMLElement;
    expect(ol.className).toContain('my-root');
    const li = ol.querySelectorAll('li');
    expect(li[0].className).toContain('my-item');
    expect(li[0].querySelector('span[aria-hidden]')?.className).toContain('my-dot');
    expect(li[0].querySelector('span.block')?.className).toContain('my-label');
  });

  it('style passthrough lên <ol> gốc', () => {
    const { container } = render(<Timeline items={ITEMS} style={{ padding: 10 }} />);
    expect((container.querySelector('ol') as HTMLElement).style.padding).toBe('10px');
  });
});
