// OrgChart tests — render cây, role a11y, collapse subtree, selection, type styling,
// connector structure, nesting sâu (case-coverage 2026-10-18).
// NOTE: truy vấn node qua getByText(label).closest('li') — accessible-name của li
// cha tính từ toàn bộ subtree (jsdom) nên regex name sẽ match cả cha lẫn con.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrgChart, type OrgChartNodeData } from './index.js';

const TREE: OrgChartNodeData = {
  key: 'ceo',
  label: 'CEO',
  type: 'dept',
  children: [
    { key: 'eng', label: 'Engineering', type: 'dept', children: [
      { key: 'fe', label: 'Hải (FE)' },
      { key: 'be', label: 'Hoi (BE)' },
    ] },
    { key: 'hr', label: 'HR', type: 'dept' },
  ],
};

const nodeLi = (label: string) => screen.getByText(label).closest('li')!;

afterEach(cleanup);

describe('OrgChart', () => {
  it('render root + role=tree/treeitem; label + type icon', () => {
    const { container } = render(<OrgChart data={TREE} />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(nodeLi('CEO')).toHaveAttribute('role', 'treeitem');
    expect(container.querySelector('ul[role="group"]')).not.toBeNull();
  });

  it('children render lồng 2 cấp (group + grandchild)', () => {
    render(<OrgChart data={TREE} />);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Hải (FE)')).toBeInTheDocument();
    expect(screen.getByText('Hoi (BE)')).toBeInTheDocument();
    // 2 level group: dưới CEO và dưới Engineering
    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  it('aria-expanded chỉ trên node có children; node lá không có', () => {
    render(<OrgChart data={TREE} />);
    expect(nodeLi('CEO')).toHaveAttribute('aria-expanded', 'true');
    expect(nodeLi('Engineering')).toHaveAttribute('aria-expanded', 'true');
    // HR là node lá (dept không con) → không aria-expanded
    expect(nodeLi('HR')).not.toHaveAttribute('aria-expanded');
    expect(nodeLi('Hải (FE)')).not.toHaveAttribute('aria-expanded');
  });

  it('chevron collapse → subtree remove khỏi DOM + aria-expanded false', async () => {
    const user = userEvent.setup();
    render(<OrgChart data={TREE} />);
    const toggle = screen.getByRole('button', { name: 'Gập/mở Engineering' });
    await user.click(toggle);
    expect(screen.queryByText('Hải (FE)')).not.toBeInTheDocument();
    expect(nodeLi('Engineering')).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByText('Hải (FE)')).toBeInTheDocument();
  });

  it('defaultCollapsedKeys → subtree ẩn lúc mount', () => {
    render(<OrgChart data={TREE} defaultCollapsedKeys={['eng']} />);
    expect(screen.queryByText('Hải (FE)')).not.toBeInTheDocument();
    expect(nodeLi('Engineering')).toHaveAttribute('aria-expanded', 'false');
  });

  it('onSelect khi click card; selectedKey → aria-selected + viền accent', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<OrgChart data={TREE} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('HR'));
    expect(onSelect).toHaveBeenCalledWith('hr');
    rerender(<OrgChart data={TREE} selectedKey="hr" />);
    expect(nodeLi('HR')).toHaveAttribute('aria-selected', 'true');
    expect(nodeLi('CEO')).toHaveAttribute('aria-selected', 'false');
  });

  it('type dept vs person → class nền khác nhau (bg-s3 vs bg-s2)', () => {
    render(<OrgChart data={TREE} />);
    const ceo = screen.getByText('CEO').closest('button')!;
    const fe = screen.getByText('Hải (FE)').closest('button')!;
    expect(ceo).toHaveClass('bg-s3', 'font-semibold'); // dept
    expect(fe).toHaveClass('bg-s2'); // person (không semibold)
    expect(fe).not.toHaveClass('font-semibold');
    // connector: node con có cột connector dọc trước card
    expect(nodeLi('Engineering').querySelector('span.h-4')).not.toBeNull();
  });

  it('className passthrough + chevron root mở subtree', () => {
    const { container } = render(<OrgChart data={TREE} defaultCollapsedKeys={['ceo']} className="marker" />);
    expect(container.firstElementChild).toHaveClass('marker');
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gập/mở CEO' }));
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });
});
