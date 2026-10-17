import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Menubar } from './index.js';
afterEach(cleanup);
describe('Menubar', () => {
  it('items + hover dropdown children', async () => {
    const user = userEvent.setup();
    render(<Menubar items={[{ key: 'f', label: 'File', children: [{ key: 'open', label: 'Mở' }] }]} />);
    await user.hover(screen.getByText('File'));
    expect(screen.getByText('Mở')).toBeInTheDocument();
  });
});
