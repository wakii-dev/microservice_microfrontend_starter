// Tooltip tests — hover/focus hiện bubble, leave ẩn, placement class.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Tooltip } from './index.js';

afterEach(cleanup);

describe('Tooltip', () => {
  it('mặc định ẩn; hover hiện bubble + arrow; leave ẩn', () => {
    render(
      <Tooltip title="Gợi ý">
        <button>Trigger</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Gợi ý');
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('focus hiện bubble (a11y bàn phím)', () => {
    render(
      <Tooltip title="Gợi ý focus">
        <button>Trigger</button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('placement bottom → class vị trí đáy', () => {
    render(
      <Tooltip title="x" placement="bottom">
        <button>Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('tooltip').className).toContain('top-[calc(100%+8px)]');
  });
});
