import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tree } from './index.js';
afterEach(cleanup);

const DATA = [
  { key: '1', label: 'Node 1', children: [
    { key: '1-1', label: 'Child 1-1' },
  ]},
  { key: '2', label: 'Node 2' },
];

describe('Tree', () => {
  it('renders root nodes; children ẩn cho đến khi expand', () => {
    render(<Tree data={DATA} />);
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.queryByText('Child 1-1')).toBeNull();
  });
  it('expand → children hiện; onNodeClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Tree data={DATA} onNodeClick={onClick} />);
    await user.click(screen.getByText('Node 1'));
    expect(screen.getByText('Child 1-1')).toBeInTheDocument();
    await user.click(screen.getByText('Child 1-1'));
    expect(onClick).toHaveBeenCalledWith('1-1');
  });
});
