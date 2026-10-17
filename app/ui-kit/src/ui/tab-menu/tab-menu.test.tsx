import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TabMenu } from './index.js';
afterEach(cleanup);
describe('TabMenu', () => {
  it('activeKey + click onChange + href link', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(<TabMenu activeKey="b" onTabChange={onTabChange}
      model={[{ key: 'a', label: 'Home', href: '/' }, { key: 'b', label: 'Tasks' }]} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tasks' }));
    expect(onTabChange).toHaveBeenCalledWith('b');
  });
});
