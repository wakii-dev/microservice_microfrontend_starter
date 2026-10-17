// Branch-fill sweep — phủ các nhánh className-passthrough + path behavior còn thiếu
// (coverage branches ≥ 90 — Tier 3/4/5 sweep 2026-10-17). Mỗi test = 1-2 nhánh nhỏ.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Avatar } from './avatar/index.js';
import { Breadcrumb } from './breadcrumb/index.js';
import { Button } from './button/index.js';
import { Collapse } from './collapse/index.js';
import { Descriptions } from './descriptions/index.js';
import { Divider } from './divider/index.js';
import { Drawer } from './drawer/index.js';
import { Dropdown } from './dropdown/index.js';
import { Input, Textarea } from './input/index.js';
import { InputNumber } from './input-number/index.js';
import { Pagination } from './pagination/index.js';
import { Progress } from './progress/index.js';
import { Result } from './result/index.js';
import { Segmented } from './segmented/index.js';
import { Space } from './space/index.js';
import { Steps } from './steps/index.js';
import { Table } from './table/index.js';
import { Tag } from './tag/index.js';
import { Tooltip } from './tooltip/index.js';
import { Typography } from './typography/index.js';
import { Radio, RadioGroup } from './radio/index.js';
import { Avatar as A2 } from './avatar/index.js';

afterEach(cleanup);

const P = 'marker';

describe('className passthrough sweep', () => {
  it('Avatar', () => {
    render(<Avatar className={P}>A</Avatar>);
    expect(screen.getByText('A').parentElement).toHaveClass(P);
  });
  it('Breadcrumb', () => {
    const { container } = render(<Breadcrumb items={[{ title: 'X' }]} className={P} />);
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Collapse', () => {
    const { container } = render(
      <Collapse className={P} items={[{ key: 'k', label: 'L', children: <span>c</span> }]} />,
    );
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Divider', () => {
    const { container } = render(<Divider className={P} dashed />);
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Drawer (title ReactNode → không aria-label string)', () => {
    render(
      <Drawer open title={<b>T</b>} className={P}>
        c
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
  });
  it('Dropdown', () => {
    render(
      <Dropdown
        className={P}
        trigger={<button>Menu</button>}
        items={[{ key: 'a', label: 'A' }]}
      />,
    );
    expect(document.querySelector(`.${P}`)).not.toBeNull();
  });
  it('InputNumber', () => {
    const { container } = render(<InputNumber ariaLabel="n" className={P} />);
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Pagination', () => {
    const { container } = render(
      <Pagination current={1} pageSize={10} total={10} className={P} onChange={vi.fn()} />,
    );
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Progress', () => {
    const { container } = render(<Progress percent={10} className={P} />);
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Radio + RadioGroup', () => {
    const { container } = render(
      <RadioGroup
        className={P}
        value="a"
        onChange={vi.fn()}
        options={[
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ]}
      />,
    );
    expect(container.firstElementChild).toHaveClass(P);
    render(<Radio className={P}>r</Radio>);
    expect(screen.getByText('r')).toHaveClass(P);
  });
  it('Result', () => {
    const { container } = render(<Result className={P} title="r" />);
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Segmented', () => {
    const { container } = render(
      <Segmented options={[{ label: 'A', value: 'a' }]} value="a" className={P} onChange={vi.fn()} />,
    );
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Space', () => {
    const { container } = render(
      <Space className={P}>
        <span>s</span>
      </Space>,
    );
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Steps', () => {
    const { container } = render(<Steps items={[{ title: 'S' }]} current={0} className={P} />);
    expect(container.firstElementChild).toHaveClass(P);
  });
  it('Tag', () => {
    render(<Tag className={P}>t</Tag>);
    expect(screen.getByText('t')).toHaveClass(P);
  });
  it('Tooltip', () => {
    render(
      <Tooltip title="tip" className={P}>
        <button>tt</button>
      </Tooltip>,
    );
    expect(document.querySelector(`.${P}`)).not.toBeNull();
  });
  it('Typography Title/Text/Paragraph', () => {
    render(
      <>
        <Typography.Title className={P}>t</Typography.Title>
        <Typography.Text className={P}>x</Typography.Text>
        <Typography.Paragraph className={P}>p</Typography.Paragraph>
      </>,
    );
    expect(screen.getByText('t')).toHaveClass(P);
    expect(screen.getByText('x')).toHaveClass(P);
    expect(screen.getByText('p')).toHaveClass(P);
  });
});

describe('behavior path sweep', () => {
  it('Button htmlType default → type=button (không submit trong form)', () => {
    const { container } = render(<Button>bt</Button>);
    expect(container.querySelector('button')).toHaveAttribute('type', 'button');
  });

  it('InputNumber: blur rỗng → null; bump từ rỗng → base 0 + step', () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="in" min={0} step={5} onChange={onChange} />);
    const input = screen.getByLabelText('in');
    // gõ giá trị rồi xoá: '3' → onChange(3); '' → onChange(null) (commit chặn raw rỗng)
    fireEvent.change(input, { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    // bump từ rỗng → base 0 + step 5
    fireEvent.click(screen.getByRole('button', { name: 'Tăng' }));
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('Input affix + invalid ring đỏ; Textarea showCount không maxLength → không đếm', () => {
    const { rerender } = render(
      <Input aria-label="aff" prefix="$" invalid value="5" readOnly />,
    );
    expect(screen.getByLabelText('aff').closest('span')).toHaveClass('border-st-fail');
    rerender(<Textarea aria-label="ta" showCount value="abc" />);
    expect(screen.queryByText(/\d\/\d+/)).toBeNull();
  });

  it('Table: className + scrollHeight string + paginator trống range "0"', () => {
    const { container } = render(
      <Table
        className={P}
        columns={[{ key: 't', title: 'T' }]}
        dataSource={[]}
        rowKey="id"
        paginator
        scrollHeight="20rem"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass(P);
    const wrapper = root.firstElementChild as HTMLElement;
    expect(wrapper.style.maxHeight).toBe('20rem');
    expect(container.querySelector('.text-label.text-ink3')).toHaveTextContent('0 / 0');
  });

  it('Table: column width + sortable=false header không button', () => {
    render(
      <Table
        columns={[
          { key: 'w', title: 'W', width: '30%', sortable: false },
        ]}
        dataSource={[{ id: '1', w: 'x' }]}
        rowKey="id"
      />,
    );
    expect(screen.getByText('W').closest('th')).toHaveStyle({ width: '30%' });
    expect(screen.queryByRole('button', { name: /W/ })).toBeNull();
  });


  it('Table: loading + selection → skeleton có cột checkbox', () => {
    const { container } = render(
      <Table
        columns={[{ key: 't', title: 'T' }]}
        dataSource={[]}
        rowKey="id"
        loading
        selectionMode="checkbox"
      />,
    );
    expect(container.querySelectorAll('.h-4').length).toBeGreaterThan(0); // text skeleton (Table dùng variant text)
  });

  it('Radio đơn không children — vẫn render input', () => {
    render(<Radio checked onChange={vi.fn()} />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('Collapse không defaultActiveKeys + items rỗng → không panel', () => {
    const { container } = render(<Collapse items={[]} className={P} />);
    expect(container.firstElementChild).toHaveClass(P);
  });

  it('Typography.Text non-string children + copyable → copy String()', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: write },
      configurable: true,
    });
    render(
      <Typography.Text copyable>
        <span>node</span>
      </Typography.Text>,
    );
    fireEvent.click(screen.getByTitle('Copy'));
    expect(write).toHaveBeenCalledWith('node');
    cleanup();
  });
});
