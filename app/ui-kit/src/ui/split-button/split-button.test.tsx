import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SplitButton } from './index.js';
afterEach(cleanup);
describe('SplitButton', () => {
  it('main click + dropdown item click', async () => {
    const onClick = vi.fn();
    const onItemClick = vi.fn();
    const user = userEvent.setup();
    render(<SplitButton label="Lưu" onClick={onClick} onItemClick={onItemClick}
      items={[{ key: 'save-exit', label: 'Lưu và thoát' }]} />);
    await user.click(screen.getByText('Lưu'));
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByLabelText('Thêm tuỳ chọn'));
    await user.click(screen.getByText('Lưu và thoát'));
    expect(onItemClick).toHaveBeenCalledWith('save-exit');
  });
});
