// Divider tests — horizontal/vertical/dashed/with-text.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Divider } from './index.js';

afterEach(cleanup);

describe('Divider', () => {
  it('horizontal mặc định → role=separator + margin 16px 0', () => {
    render(<Divider />);
    const el = screen.getByRole('separator');
    expect(el).toHaveStyle({ margin: '16px 0' });
  });

  it('vertical → orientation vertical + h 0.9em', () => {
    render(<Divider type="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('dashed → border-dashed', () => {
    render(<Divider dashed />);
    expect(screen.getByRole('separator').className).toContain('border-dashed');
  });

  it('with text → text giữa 2 đường kẻ', () => {
    render(<Divider>hoặc</Divider>);
    expect(screen.getByText('hoặc')).toBeInTheDocument();
  });
});

describe('Divider — combo branch (Tier 5 sweep)', () => {
  it('vertical + dashed; with-text dashed; with-text solid', () => {
    // RTL render mỗi lần tạo container mới trong body — query qua document (cộng dồn)
    const one = render(<Divider type="vertical" dashed />);
    expect(one.container.querySelector('span[role="separator"]')?.className).toContain('border-dashed');
    one.unmount();
    const two = render(<Divider dashed>hoặc</Divider>);
    // with-text: outer giữ role=separator; 2 line span border-dashed
    expect(two.container.querySelectorAll('span.border-dashed').length).toBe(2);
    two.unmount();
    const three = render(<Divider>hoặc</Divider>);
    expect(three.container.querySelectorAll('span.border-dashed').length).toBe(0);
    three.unmount();
  });
});
