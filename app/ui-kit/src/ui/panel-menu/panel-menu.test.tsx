import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { PanelMenu } from './index.js';
afterEach(cleanup);
describe('PanelMenu', () => {
  it('accordion open/close', async () => {
    const user = userEvent.setup();
    render(<PanelMenu items={[{ key: 's', label: 'Settings', children: [{ key: 'g', label: 'General' }] }]} />);
    await user.click(screen.getByText('Settings'));
    expect(screen.getByText('General')).toBeInTheDocument();
  });
});
