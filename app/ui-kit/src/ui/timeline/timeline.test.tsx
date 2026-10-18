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
