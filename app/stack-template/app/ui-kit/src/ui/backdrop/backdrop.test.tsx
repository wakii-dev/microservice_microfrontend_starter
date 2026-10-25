// Backdrop tests — open render scrim token, click bubble onClick, closed null.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Backdrop } from './index.js';

afterEach(cleanup);

describe('Backdrop', () => {
  it('open=false → null; open → scrim fixed z-modal + token --scrim-4', () => {
    const { rerender } = render(<Backdrop open={false} onClick={() => {}} />);
    expect(screen.queryByTestId('backdrop')).toBeNull();
    rerender(<Backdrop open onClick={() => {}} />);
    const scrim = screen.getByTestId('backdrop');
    expect(scrim.className).toContain('bg-scrim-4');
    expect(scrim.className).toContain('z-[var(--z-modal)]');
    expect(scrim).toHaveAttribute('aria-hidden', 'true');
  });

  it('click scrim → onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Backdrop open onClick={onClick} />);
    await user.click(screen.getByTestId('backdrop'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('children render giữa scrim (slot Spinner) + className passthrough', () => {
    render(
      <Backdrop open className="marker-scrim">
        <div>busy</div>
      </Backdrop>,
    );
    expect(screen.getByText('busy')).toBeInTheDocument();
    expect(screen.getByTestId('backdrop')).toHaveClass('marker-scrim');
  });
});
