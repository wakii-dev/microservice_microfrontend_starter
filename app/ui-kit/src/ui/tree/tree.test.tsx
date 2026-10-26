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

  it('collapse lại → children ẩn; aria-expanded true ↔ false', async () => {
    const user = userEvent.setup();
    render(<Tree data={DATA} />);
    const node1 = screen.getByRole('treeitem', { name: 'Node 1' });
    expect(node1).toHaveAttribute('aria-expanded', 'false');
    await user.click(node1);
    expect(node1).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Child 1-1')).toBeInTheDocument();
    await user.click(node1);
    expect(node1).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Child 1-1')).toBeNull();
  });

  it('leaf node → KHÔNG aria-expanded; role=tree ở gốc', () => {
    render(<Tree data={DATA} />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'Node 2' })).not.toHaveAttribute('aria-expanded');
  });

  it('defaultExpandedKeys → children hiện sẵn lúc mount', () => {
    render(<Tree data={DATA} defaultExpandedKeys={['1']} />);
    expect(screen.getByText('Child 1-1')).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'Node 1' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('className passthrough lên ul gốc', () => {
    const { container } = render(<Tree data={DATA} className="marker" />);
    expect(container.querySelector('ul')).toHaveClass('marker');
  });

  // ── Case-coverage audit 2026-10-18 (antd parity: showLine) ──

  it('showLine → ul group có border-l connector; mặc định không có', () => {
    const { container, rerender } = render(<Tree data={DATA} defaultExpandedKeys={['1']} showLine />);
    const group = container.querySelector('ul[role="group"]')!;
    expect(group).toHaveClass('border-l', 'border-line', 'ml-3');

    rerender(<Tree data={DATA} defaultExpandedKeys={['1']} />);
    expect(container.querySelector('ul[role="group"]')!).not.toHaveClass('border-l');
  });

  it('showLine: root ul không border-l (line chỉ ở cấp con)', () => {
    const { container } = render(<Tree data={DATA} defaultExpandedKeys={['1']} showLine />);
    const root = container.querySelector('ul[role="tree"]')!;
    expect(root).not.toHaveClass('border-l');
    expect(root.querySelector('ul[role="group"]')!).toHaveClass('border-l');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Tree — classNames + style', () => {
  const DATA = [
    { key: 'a', label: 'Alpha', children: [{ key: 'a1', label: 'Alpha 1' }] },
  ];

  it('slots root/item/group lên đúng element mọi cấp', () => {
    render(<Tree data={DATA} defaultExpandedKeys={['a']} classNames={{ root: 'slot-root', item: 'slot-item', group: 'slot-group' }} />);
    expect(document.querySelector('ul[role="tree"].slot-root')).not.toBeNull();
    expect(screen.getByRole('treeitem', { name: 'Alpha' })).toHaveClass('slot-item');
    expect(screen.getByRole('treeitem', { name: 'Alpha 1' })).toHaveClass('slot-item');
    expect(document.querySelector('ul[role="group"].slot-group')).not.toBeNull();
  });

  it('style passthrough lên ul gốc; className người dùng sau root slot', () => {
    render(<Tree data={DATA} style={{ padding: '2px' }} classNames={{ root: 'slot-root' }} className="user-last" />);
    const ul = document.querySelector('ul[role="tree"].slot-root') as HTMLElement;
    expect(ul).toHaveStyle({ padding: '2px' });
    expect(ul.className.indexOf('slot-root')).toBeLessThan(ul.className.indexOf('user-last'));
  });
});
