// TreeSelect tests — chọn leaf → value + đường dẫn, search theo label + đường
// dẫn, clear, parent không chọn được, empty search.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TreeSelect, type TreeNode } from './index.js';

const TREE: TreeNode[] = [
  {
    value: 'hn',
    label: 'Hà Nội',
    children: [
      { value: 'hn-bd', label: 'Ba Đình' },
      { value: 'hn-th', label: 'Tây Hồ' },
    ],
  },
  {
    value: 'hcm',
    label: 'TP.HCM',
    children: [
      { value: 'hcm-q1', label: 'Quận 1' },
      { value: 'hcm-q3', label: 'Quận 3' },
    ],
  },
  { value: 'dn', label: 'Đà Nẵng' },
];

afterEach(cleanup);

describe('TreeSelect', () => {
  it('trigger combobox + placeholder khi chưa chọn', () => {
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} placeholder="Chọn địa điểm…" />);
    const trigger = screen.getByRole('combobox', { name: 'Địa điểm' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('Chọn địa điểm…');
  });

  it('open → chỉ leaf là role=option; parent là group header', async () => {
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5); // 4 leaf con + 1 leaf gốc
    expect(screen.getByRole('option', { name: 'Ba Đình' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Đà Nẵng' })).toBeInTheDocument();
    expect(screen.getByText('Hà Nội')).toBeInTheDocument(); // parent hiển thị header
  });

  it('chọn node con → onChange(value) + trigger hiện đường dẫn "Cha / Con"', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    await user.click(screen.getByRole('option', { name: 'Ba Đình' }));
    expect(onChange).toHaveBeenCalledWith('hn-bd');
    expect(screen.getByRole('combobox', { name: 'Địa điểm' })).toHaveTextContent('Hà Nội / Ba Đình');
    expect(screen.queryByRole('listbox')).toBeNull(); // chọn xong đóng
  });

  it('value điều khiển từ ngoài → trigger hiện đủ đường dẫn', () => {
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} value="hcm-q1" />);
    expect(screen.getByRole('combobox', { name: 'Địa điểm' })).toHaveTextContent('TP.HCM / Quận 1');
  });

  it('search theo label → lọc leaf khớp', async () => {
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    await user.type(screen.getByLabelText('Địa điểm — tìm kiếm'), 'Tây');
    expect(screen.getByRole('option', { name: 'Tây Hồ' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Ba Đình' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'Quận 1' })).toBeNull();
  });

  it('search theo đường dẫn → gõ tên cha ra toàn bộ leaf con', async () => {
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    await user.type(screen.getByLabelText('Địa điểm — tìm kiếm'), 'HCM');
    expect(screen.getByRole('option', { name: 'Quận 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Quận 3' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Tây Hồ' })).toBeNull();
  });

  it('search không khớp → "Không có kết quả"', async () => {
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    await user.type(screen.getByLabelText('Địa điểm — tìm kiếm'), 'không-tồn-tại');
    expect(screen.getByText('Không có kết quả')).toBeInTheDocument();
    expect(screen.queryByRole('option')).toBeNull();
  });

  it('clear → onChange("") + về placeholder', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} value="hn-bd" onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Địa điểm' });
    expect(trigger).toHaveTextContent('Hà Nội / Ba Đình');
    await user.click(screen.getByRole('button', { name: 'Xoá' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(trigger).toHaveTextContent('Chọn…');
  });

  it('click parent header → không chọn, panel vẫn mở', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    await user.click(screen.getByText('Hà Nội'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('Escape đóng panel', async () => {
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('searchable=false → panel không ô tìm kiếm', async () => {
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} searchable={false} />);
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.queryByLabelText('Địa điểm — tìm kiếm')).toBeNull();
  });

  it('clearable=false → có value nhưng không nút Xoá', () => {
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} value="hn-bd" clearable={false} />);
    expect(screen.getByRole('combobox', { name: 'Địa điểm' })).toHaveTextContent('Hà Nội / Ba Đình');
    expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
  });

  it('disabled → không mở panel, không clear được', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} value="hn-bd" disabled onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Địa điểm' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keyboard: focus trigger + ArrowDown → mở panel', async () => {
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} />);
    screen.getByRole('combobox', { name: 'Địa điểm' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ba Đình' }).className).toContain('bg-s3');
  });

  it('keyboard: Enter mở panel → active mặc định leaf đầu → Enter commit onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TreeSelect ariaLabel="Địa điểm" treeData={TREE} onChange={onChange} />);
    screen.getByRole('combobox', { name: 'Địa điểm' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}'); // input autofocus nhận keydown — active 0→1
    const second = screen.getByRole('option', { name: 'Tây Hồ' });
    expect(second.className).toContain('bg-s3');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('hn-th');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('TreeSelect — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root (span wrapper) / trigger (combobox) / panel / listbox / option', async () => {
    const user = userEvent.setup();
    render(
      <TreeSelect
        ariaLabel="Địa điểm"
        treeData={TREE}
        classNames={{ root: 'slot-root', trigger: 'slot-trigger', panel: 'slot-panel', listbox: 'slot-listbox', option: 'slot-option' }}
      />,
    );
    const root = screen.getByRole('combobox', { name: 'Địa điểm' }).closest('.relative')!;
    expect(root).toHaveClass('slot-root');
    expect(screen.getByRole('combobox', { name: 'Địa điểm' })).toHaveClass('slot-trigger');
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveClass('slot-listbox');
    expect(listbox.parentElement).toHaveClass('slot-panel');
    expect(screen.getByRole('option', { name: 'Ba Đình' })).toHaveClass('slot-option');
  });

  it('style passthrough lên root + không truyền slots → chọn leaf vẫn onChange (behavior giữ nguyên)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TreeSelect ariaLabel="Địa điểm" treeData={TREE} onChange={onChange} style={{ margin: '8px' }} className="user-last" />,
    );
    const root = screen.getByRole('combobox', { name: 'Địa điểm' }).closest('.relative') as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThan(root.className.indexOf('inline-flex'));
    await user.click(screen.getByRole('combobox', { name: 'Địa điểm' }));
    await user.click(screen.getByRole('option', { name: 'Ba Đình' }));
    expect(onChange).toHaveBeenCalledWith('hn-bd');
  });
});
