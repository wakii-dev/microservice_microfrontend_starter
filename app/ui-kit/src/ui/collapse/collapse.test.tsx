// Collapse tests — mở/đóng panel, nhiều panel cùng lúc, defaultActiveKeys.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Collapse } from './index.js';

const ITEMS = [
  { key: 'a', label: 'Panel A', children: <p>nội dung A</p> },
  { key: 'b', label: 'Panel B', children: <p>nội dung B</p> },
];

afterEach(cleanup);

describe('Collapse', () => {
  it('mặc định đóng; click label → mở; click lần nữa → đóng', async () => {
    const user = userEvent.setup();
    render(<Collapse items={ITEMS} />);
    expect(screen.queryByText('nội dung A')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Panel A' }));
    expect(screen.getByText('nội dung A')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Panel A' }));
    expect(screen.queryByText('nội dung A')).toBeNull();
  });

  it('nhiều panel mở cùng lúc + defaultActiveKeys', () => {
    render(<Collapse items={ITEMS} defaultActiveKeys={['a', 'b']} />);
    expect(screen.getByText('nội dung A')).toBeInTheDocument();
    expect(screen.getByText('nội dung B')).toBeInTheDocument();
  });
});
