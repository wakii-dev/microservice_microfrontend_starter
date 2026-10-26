import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToggleButton } from './index.js';
afterEach(cleanup);
describe('ToggleButton', () => {
  it('aria-pressed + click → onChange(!checked)', async () => {
    const onChange = vi.fn();
    render(<ToggleButton checked={false} onChange={onChange}>Toggle</ToggleButton>);
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Toggle' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('ToggleButton — matrix (props thật: checked/onChange/disabled/className)', () => {
  it('checked=true → click → onChange(false) (flip ngược)', async () => {
    const onChange = vi.fn();
    render(<ToggleButton checked onChange={onChange}>Bật</ToggleButton>);
    expect(screen.getByRole('button', { name: 'Bật' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Bật' }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('disabled → không bấm được, không gọi onChange', async () => {
    const onChange = vi.fn();
    render(<ToggleButton disabled onChange={onChange}>Khoá</ToggleButton>);
    const btn = screen.getByRole('button', { name: 'Khoá' });
    expect(btn).toBeDisabled();
    await userEvent.setup().click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('className passthrough', () => {
    render(<ToggleButton className="marker">c</ToggleButton>);
    expect(screen.getByRole('button', { name: 'c' })).toHaveClass('marker');
  });
});

// ── slots-wave: classNames slot + style passthrough ──

describe('ToggleButton — classNames + style', () => {
  it('slot root lên button cả 2 trạng thái; className sau slot', () => {
    const { rerender } = render(
      <ToggleButton checked classNames={{ root: 'slot-root' }} className="user-last">on</ToggleButton>,
    );
    const btn = screen.getByRole('button', { name: 'on' });
    expect(btn).toHaveClass('slot-root');
    expect(btn.className.indexOf('slot-root')).toBeLessThan(btn.className.indexOf('user-last'));
    rerender(<ToggleButton checked={false} classNames={{ root: 'slot-root' }} className="user-last">on</ToggleButton>);
    expect(screen.getByRole('button', { name: 'on' })).toHaveClass('slot-root');
  });

  it('style passthrough lên button (toggle vẫn bấm được)', async () => {
    const onChange = vi.fn();
    render(<ToggleButton onChange={onChange} style={{ margin: '8px' }}>s</ToggleButton>);
    const btn = screen.getByRole('button', { name: 's' });
    expect(btn).toHaveStyle({ margin: '8px' });
    await userEvent.setup().click(btn);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
