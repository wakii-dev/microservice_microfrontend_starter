// Icon tests — render theo name (svg + aria-hidden), size, className merge,
// fill currentColor, icon lạ → fallback help-circle, smoke cả bộ ICON_NAMES.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Icon, ICON_NAMES, type IconName } from './index.js';

afterEach(cleanup);

describe('Icon', () => {
  it('render theo name — svg tồn tại + viewBox 24 + aria-hidden mặc định true', () => {
    const { container } = render(<Icon name="search" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('aria-hidden=false override được (icon có nghĩa đứng một mình)', () => {
    const { container } = render(<Icon name="check" aria-hidden={false} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'false');
  });

  it('size prop đổi width/height — default 14', () => {
    const { container, rerender } = render(<Icon name="check" />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '14');
    expect(container.querySelector('svg')).toHaveAttribute('height', '14');
    rerender(<Icon name="check" size={24} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
    expect(container.querySelector('svg')).toHaveAttribute('height', '24');
  });

  it('className merge lên svg', () => {
    const { container } = render(<Icon name="plus" className="text-accent shrink-0" />);
    expect(container.querySelector('svg')).toHaveClass('text-accent', 'shrink-0');
  });

  it('fill currentColor — kế thừa màu text cha', () => {
    const { container } = render(<Icon name="star" />);
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
  });

  it('icon lạ (cast runtime) → fallback help-circle, không crash', () => {
    const bad = render(<Icon name={'khong-ton-tai' as IconName} />);
    const ref = render(<Icon name="help-circle" />);
    const badD = bad.container.querySelector('path')!.getAttribute('d');
    expect(badD).toBeTruthy();
    expect(ref.container.querySelector('path')!.getAttribute('d')).toBe(badD);
  });

  it('ICON_NAMES đủ 48 + render được cả bộ (smoke, gồm multi-path như check-circle/users/trash)', () => {
    expect(ICON_NAMES).toHaveLength(48);
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(<Icon name={name} />);
      const svg = container.querySelector('svg');
      expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
      unmount();
    }
  });
});
