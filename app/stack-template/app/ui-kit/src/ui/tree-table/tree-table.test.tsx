// TreeTable tests — render cây, expand/collapse + onRowToggle, indent depth,
// selection single/checkbox + select-all, render cell custom, align, empty,
// controlled expandedKeys, a11y treegrid (aria-level/expanded/selected).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TreeTable, type TreeTableNode } from './index.js';

const TREE: TreeTableNode[] = [
  {
    key: 'root',
    values: { name: 'Root', size: '—' },
    children: [
      {
        key: 'src',
        values: { name: 'src', size: '2MB' },
        children: [{ key: 'app', values: { name: 'app.tsx', size: '4KB' } }],
      },
      { key: 'readme', values: { name: 'README.md', size: '1KB' } },
    ],
  },
];

const COLS = [
  { key: 'name', header: 'Name' },
  { key: 'size', header: 'Size', align: 'right' as const },
];

afterEach(cleanup);

const row = (k: string) => screen.getByRole('row', { name: new RegExp(k, 'i') });

describe('TreeTable', () => {
  it('render node gốc + node lá; mặc định subtree GỤP (track 0fr, aria-expanded=false)', () => {
    render(<TreeTable data={TREE} columns={COLS} />);
    expect(row('root')).toBeInTheDocument();
    expect(row('readme')).toBeInTheDocument();
    // 3-tier pattern: subtree vẫn trong DOM (clip), trạng thái đọc qua row + wrapper
    const srcRow = row('src');
    expect(srcRow).toHaveAttribute('aria-expanded', 'false');
    expect(srcRow.nextElementSibling!.className).toContain('grid-rows-[0fr]');
  });

  it('expand: click chevron → con xuất hiện, aria-expanded=true, chevron rotate-90', () => {
    render(<TreeTable data={TREE} columns={COLS} />);
    const btn = screen.getByRole('button', { name: 'Mở root' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('[data-key="src"]')).not.toBeNull();
    // 3-tier: cháu vẫn trong DOM nhưng bị clip — wrapper của src còn track 0fr
    const srcRow = screen.getByRole("row", { name: /src/i });
    expect(srcRow).toHaveAttribute("aria-expanded", "false");
    expect(srcRow.nextElementSibling!.className).toContain("grid-rows-[0fr]");
    // chevron xoay
    expect((btn.firstElementChild as HTMLElement).className).toContain('rotate-90');
  });

  it('defaultExpandedKeys → mở sẵn cả 2 cấp', () => {
    render(<TreeTable data={TREE} columns={COLS} defaultExpandedKeys={['root', 'src']} />);
    expect(document.querySelector('[data-key="app"]')).not.toBeNull();
  });

  it('collapse lại: click lần 2 → subtree rời DOM + onRowToggle payload', () => {
    const onRowToggle = vi.fn();
    render(<TreeTable data={TREE} columns={COLS} onRowToggle={onRowToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở root' }));
    expect(onRowToggle).toHaveBeenLastCalledWith(['root']);
    fireEvent.click(screen.getByRole('button', { name: 'Đóng root' }));
    expect(onRowToggle).toHaveBeenLastCalledWith([]);
    const srcRow = row('src');
    expect(srcRow).toHaveAttribute('aria-expanded', 'false');
    expect(srcRow.nextElementSibling!.className).toContain('grid-rows-[0fr]');
  });

  it('controlled expandedKeys: click KHÔNG tự đổi — chỉ bắn onRowToggle', () => {
    const onRowToggle = vi.fn();
    render(<TreeTable data={TREE} columns={COLS} expandedKeys={['root']} onRowToggle={onRowToggle} />);
    expect(document.querySelector('[data-key="src"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Đóng root' }));
    expect(onRowToggle).toHaveBeenCalledWith([]);
    expect(document.querySelector('[data-key="src"]')).not.toBeNull(); // vẫn theo prop
  });

  it('indent theo depth: cell expander con có padding-left = sp-4 × depth', () => {
    render(<TreeTable data={TREE} columns={COLS} defaultExpandedKeys={['root']} />);
    const rootCell = row('root').firstElementChild as HTMLElement;
    const srcCell = document.querySelector('[data-key="src"] [role="gridcell"]') as HTMLElement;
    expect(rootCell.style.paddingLeft).toBe('calc(var(--sp-4) * 0)');
    expect(srcCell.style.paddingLeft).toBe('calc(var(--sp-4) * 1)');
  });

  it('selectionMode single: click row → aria-selected + onSelectionChange([key])', () => {
    const onSelectionChange = vi.fn();
    render(<TreeTable data={TREE} columns={COLS} selectionMode="single" onSelectionChange={onSelectionChange} />);
    fireEvent.click(row('readme'));
    expect(onSelectionChange).toHaveBeenCalledWith(['readme']);
    expect(row('readme')).toHaveAttribute('aria-selected', 'true');
    expect((row('readme') as HTMLElement).className).toContain('bg-accent/10');
  });

  it('selectionMode checkbox: toggle từng hàng + select-all chọn toàn cây', () => {
    const onSelectionChange = vi.fn();
    render(
      <TreeTable data={TREE} columns={COLS} selectionMode="checkbox" defaultExpandedKeys={['root', 'src']} onSelectionChange={onSelectionChange} />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn readme' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['readme']);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['root', 'src', 'app', 'readme']);
  });

  it('render cell custom + align right nhận class text-right', () => {
    render(
      <TreeTable
        data={TREE}
        columns={[
          { key: 'name', header: 'Name', render: (n) => <strong>{n.values.name}!</strong> },
          { key: 'size', header: 'Size', align: 'right' },
        ]}
        defaultExpandedKeys={['root']}
      />,
    );
    expect(screen.getByText('README.md!')).toBeInTheDocument();
    const sizeCell = row('readme').lastElementChild as HTMLElement;
    expect(sizeCell.className).toContain('text-right');
  });

  it('a11y treegrid: aria-level + rowgroup + empty → EmptyState', () => {
    render(<TreeTable data={TREE} columns={COLS} defaultExpandedKeys={['root']} />);
    expect(document.querySelector('[role="treegrid"]')).not.toBeNull();
    expect(row('root')).toHaveAttribute('aria-level', '1');
    expect(document.querySelector('[data-key="app"]')!).toHaveAttribute('aria-level', '3');
    const { unmount } = render(<TreeTable data={[]} columns={COLS} />);
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    unmount();
  });
});
