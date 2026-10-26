import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rating } from './index.js';
afterEach(cleanup);
describe('Rating', () => {
  it('max stars render; click → onChange', async () => {
    const onChange = vi.fn();
    render(<Rating onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('button', { name: '3 sao' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
  it('readonly → không click được', async () => {
    const onChange = vi.fn();
    render(<Rating readOnly onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('button', { name: '1 sao' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ── Coverage audit additions ─────────────────────────────────────────────────────
describe('Rating — coverage audit', () => {
  it('disabled → không click được', async () => {
    const onChange = vi.fn();
    render(<Rating disabled onChange={onChange} />);
    const star = screen.getByRole('button', { name: '4 sao' });
    expect(star).toBeDisabled();
    await userEvent.setup().click(star);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('max=10 → 10 sao; value 6 → 6 sao filled (class text-st-doing)', () => {
    render(<Rating value={6} max={10} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(10);
    expect(stars[5].className).toContain('text-st-doing');
    expect(stars[6].className).not.toContain('text-st-doing');
  });

  it('radiogroup aria + mỗi sao là button aria-label "N sao"', () => {
    render(<Rating value={3} />);
    expect(screen.getByRole('radiogroup', { name: 'Đánh giá' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3 sao' })).toHaveAttribute('aria-label', '3 sao');
  });
});

describe('Rating — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root (radiogroup) / star (mỗi button)', () => {
    render(<Rating value={3} classNames={{ root: 'slot-root', star: 'slot-star' }} />);
    const root = screen.getByRole('radiogroup', { name: 'Đánh giá' });
    expect(root).toHaveClass('slot-root');
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: `${i} sao` })).toHaveClass('slot-star');
    }
  });

  it('style passthrough lên root + không truyền slots → click sao vẫn onChange (behavior giữ nguyên)', async () => {
    const onChange = vi.fn();
    render(<Rating onChange={onChange} style={{ margin: '8px' }} className="user-last" />);
    const root = screen.getByRole('radiogroup', { name: 'Đánh giá' }) as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThan(root.className.indexOf('inline-flex'));
    await userEvent.setup().click(screen.getByRole('button', { name: '3 sao' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
