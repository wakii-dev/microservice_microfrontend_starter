// Avatar tests — chữ cái, size, shape, src.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Avatar } from './index.js';

afterEach(cleanup);

describe('Avatar', () => {
  it('mặc định 32 circle + chữ cái', () => {
    const { container } = render(<Avatar>A</Avatar>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe('32px');
    expect(el.style.borderRadius).toBe('50%');
    expect(el).toHaveTextContent('A');
  });

  it('square + size tuỳ ý', () => {
    const { container } = render(<Avatar size={48} shape="square">B</Avatar>);
    expect((container.firstElementChild as HTMLElement).style.width).toBe('48px');
    expect((container.firstElementChild as HTMLElement).style.borderRadius).toBe('var(--r-2)');
  });

  it('src → img', () => {
    render(<Avatar src="/a.png" alt="me" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/a.png');
  });
});

describe('Avatar — branch phụ', () => {
  it('không children/src → chỉ khung rỗng; className passthrough', () => {
    const { container } = render(<Avatar className="marker" />);
    expect(container.firstElementChild).toHaveClass('marker');
    expect(container.firstElementChild?.textContent).toBe('');
  });

  it('icon node (ReactNode bất kỳ) render thay chữ', () => {
    render(<Avatar><span data-testid="ic">★</span></Avatar>);
    expect(screen.getByTestId('ic')).toBeInTheDocument();
  });
});

describe('Avatar — branch phụ (Tier 5 sweep)', () => {
  it('children chữ fallback span fontSize = size*0.44', () => {
    render(<Avatar size={40}>VN</Avatar>);
    const inner = screen.getByText('VN');
    expect(inner.style.fontSize).toBe('17.6px');
  });
});
