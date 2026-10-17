import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeedDial } from './index.js';
afterEach(cleanup);

describe('SpeedDial', () => {
  it('FAB đóng mặc định; click mở actions; action click → callback + đóng', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <SpeedDial icon="+" actions={[{ key: 'a', icon: 'A', label: 'Action A', onClick }]} />
    );
    expect(screen.queryByLabelText('Action A')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Thao tác' }));
    expect(screen.getByLabelText('Action A')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Action A'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Action A')).toBeNull();
  });
});
