// Radio/Group tests — chọn 1 trong nhóm, disabled per-option.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Radio, RadioGroup } from './index.js';

afterEach(cleanup);

describe('RadioGroup', () => {
  it('value hiện tại checked; chọn option khác → onChange(value)', async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        value="a"
        onChange={onChange}
        options={[
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ]}
      />,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('option disabled → không chọn được', async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        value="a"
        onChange={onChange}
        options={[
          { label: 'A', value: 'a' },
          { label: 'Khoá', value: 'k', disabled: true },
        ]}
      />,
    );
    await userEvent.setup().click(screen.getByText('Khoá'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Radio đơn — onChange(checked)', async () => {
    const onChange = vi.fn();
    render(<Radio checked={false} onChange={onChange}>r</Radio>);
    await userEvent.setup().click(screen.getByText('r'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Radio — branch phụ (Tier 5 sweep)', () => {
  it('disabled → label class ink3 + không tick được', async () => {
    const onChange = vi.fn();
    render(<Radio disabled onChange={onChange}>r</Radio>);
    expect(screen.getByText('r')).toHaveClass('cursor-not-allowed');
    await userEvent.setup().click(screen.getByRole('radio'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ── Coverage audit additions ─────────────────────────────────────────────────────
describe('RadioGroup — group-level disabled (coverage audit)', () => {
  it('disabled group → mọi radio khoá, click không gọi onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <RadioGroup
        value="a"
        disabled
        onChange={onChange}
        options={[
          { label: 'Free', value: 'a' },
          { label: 'Pro', value: 'b' },
        ]}
      />,
    );
    const inputs = screen.getAllByRole('radio');
    expect(inputs).toHaveLength(2);
    for (const input of inputs) expect(input).toBeDisabled();
    await user.click(screen.getByText('Pro'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Radio — classNames slots + style (SÓNG-3)', () => {
  it('Radio slots lên đúng element: root→label, box→input, label→span bọc children', () => {
    render(
      <Radio classNames={{ root: 'slot-root', box: 'slot-box', label: 'slot-label' }}>
        Hình thức
      </Radio>,
    );
    const box = screen.getByRole('radio');
    expect(box).toHaveClass('slot-box');
    expect(box.closest('label')).toHaveClass('slot-root');
    expect(screen.getByText('Hình thức')).toHaveClass('slot-label');
  });

  it('Group root slot + style passthrough; chọn option vẫn onChange; className sau root slot', async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        value="a"
        onChange={onChange}
        aria-label="G"
        style={{ padding: '2px' }}
        classNames={{ root: 'slot-root' }}
        className="user-last"
        options={[
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ]}
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveStyle({ padding: '2px' });
    expect(group).toHaveClass('slot-root');
    expect(group.className.indexOf('slot-root')).toBeLessThan(group.className.indexOf('user-last'));
    await userEvent.setup().click(screen.getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
