// ToggleButtonGroup tests — role=group + single/multiple value semantics +
// disabled group/con-nút + passthrough cho ToggleButton không `value`.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToggleButton } from './index.js';
import { ToggleButtonGroup } from './toggle-button-group.js';

afterEach(cleanup);

const VIEWS = (
  <>
    <ToggleButton value="list">List</ToggleButton>
    <ToggleButton value="board">Board</ToggleButton>
    <ToggleButton value="timeline">Timeline</ToggleButton>
  </>
);

describe('ToggleButtonGroup', () => {
  it('role=group + aria-label', () => {
    render(<ToggleButtonGroup ariaLabel="View mode">{VIEWS}</ToggleButtonGroup>);
    expect(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument();
  });

  it('single: value="list" → nút List pressed; click khác → onChange(value mới)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleButtonGroup value="list" onChange={onChange} ariaLabel="View">
        {VIEWS}
      </ToggleButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Board' }));
    expect(onChange).toHaveBeenCalledWith('board');
  });

  it('multiple: click thêm vào mảng; bấm nút đang chọn → bỏ khỏi mảng', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleButtonGroup multiple value={['bugs']} onChange={onChange} ariaLabel="Filters">
        <ToggleButton value="bugs">Bugs</ToggleButton>
        <ToggleButton value="features">Features</ToggleButton>
      </ToggleButtonGroup>,
    );
    await user.click(screen.getByRole('button', { name: 'Features' }));
    expect(onChange).toHaveBeenCalledWith(['bugs', 'features']);
    await user.click(screen.getByRole('button', { name: 'Bugs' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('group disabled → mọi nút disabled, không gọi onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleButtonGroup disabled value="list" onChange={onChange} ariaLabel="View">
        {VIEWS}
      </ToggleButtonGroup>,
    );
    for (const name of ['List', 'Board', 'Timeline']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    await user.click(screen.getByRole('button', { name: 'Board' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disabled từng nút vẫn ăn khi group không khoá', () => {
    render(
      <ToggleButtonGroup ariaLabel="View">
        <ToggleButton value="a">A</ToggleButton>
        <ToggleButton value="b" disabled>B</ToggleButton>
      </ToggleButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'B' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'A' })).not.toBeDisabled();
  });

  it('ToggleButton không `value` → giữ nguyên checked/onChange riêng (đứng lẻ trong group)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleButtonGroup value="x" onChange={() => {}} ariaLabel="Mixed">
        <ToggleButton checked onChange={onChange}>Loose</ToggleButton>
      </ToggleButtonGroup>,
    );
    expect(screen.getByRole('button', { name: 'Loose' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Loose' }));
    expect(onChange).toHaveBeenCalledWith(false); // onChange gốc, không phải onChange group
  });

  it('className passthrough ra container group', () => {
    render(<ToggleButtonGroup className="marker-group" ariaLabel="View">{VIEWS}</ToggleButtonGroup>);
    expect(screen.getByRole('group', { name: 'View' })).toHaveClass('marker-group');
  });
});
