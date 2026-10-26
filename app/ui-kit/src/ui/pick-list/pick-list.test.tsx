// PickList tests — 2 panel render, click pick highlight, › chuyển Nguồn→Đích,
// ‹ chuyển ngược, toggle bỏ pick, picked reset sau move.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PickList } from './index.js';

const SOURCE = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'ng' },
];
const TARGET = [{ label: 'Svelte', value: 'svelte' }];

afterEach(cleanup);

describe('PickList', () => {
  it('render 2 panel Nguồn/Đích với đủ items', () => {
    render(<PickList source={SOURCE} target={TARGET} />);
    expect(screen.getByText('Nguồn')).toBeInTheDocument();
    expect(screen.getByText('Đích')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Svelte')).toBeInTheDocument();
  });

  it('click item → picked highlight; nút › disabled → enabled', async () => {
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={[]} />);
    const right = screen.getByRole('button', { name: 'Chuyển sang đích' });
    expect(right).toBeDisabled();
    await user.click(screen.getByText('React'));
    expect(screen.getByText('React')).toHaveClass('text-accent'); // highlight picked
    expect(right).toBeEnabled();
  });

  it('click lần 2 → bỏ pick, nút › disabled lại', async () => {
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={[]} />);
    await user.click(screen.getByText('React'));
    expect(screen.getByRole('button', { name: 'Chuyển sang đích' })).toBeEnabled();
    await user.click(screen.getByText('React'));
    expect(screen.getByText('React')).not.toHaveClass('text-accent');
    expect(screen.getByRole('button', { name: 'Chuyển sang đích' })).toBeDisabled();
  });

  it('› → items đã pick chuyển Nguồn→Đích + onChange(source còn lại, target mới) + reset pick', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={TARGET} onChange={onChange} />);
    await user.click(screen.getByText('Vue'));
    await user.click(screen.getByRole('button', { name: 'Chuyển sang đích' }));
    expect(onChange).toHaveBeenCalledWith(
      [SOURCE[0], SOURCE[2]],
      [...TARGET, SOURCE[1]],
    );
    expect(screen.getByRole('button', { name: 'Chuyển sang đích' })).toBeDisabled(); // picked reset
    expect(screen.getByText('Vue')).toBeInTheDocument(); // vẫn trong DOM — giờ ở panel Đích
  });

  it('‹ → item trong Đích chuyển ngược về Nguồn', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={TARGET} onChange={onChange} />);
    await user.click(screen.getByText('Svelte'));
    await user.click(screen.getByRole('button', { name: 'Chuyển về nguồn' }));
    expect(onChange).toHaveBeenCalledWith([...SOURCE, TARGET[0]], []);
    expect(screen.getByRole('button', { name: 'Chuyển về nguồn' })).toBeDisabled();
  });
});

describe('PickList — keyboard nav (audit fix)', () => {
  it('Enter trong listbox → pick item active mặc định (React); nút chuyển enabled', async () => {
    // userEvent.keyboard — event pipeline thật (fireEvent keyDown đầu tiên bị
    // nuốt bởi delegation warm-up của React 19 trong jsdom)
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={[]} onChange={onChange} />);
    const list = screen.getByRole('listbox', { name: 'Nguồn' });
    await user.click(list); // focus listbox
    await user.keyboard('{Enter}');
    expect(list.querySelector('[aria-selected="true"]')).toHaveTextContent('React');
    await user.click(screen.getByRole('button', { name: 'Chuyển sang đích' }));
    expect(onChange).toHaveBeenCalledWith([SOURCE[1], SOURCE[2]], [SOURCE[0]]);
  });

  it('ArrowDown di chuyển active → Enter pick item theo activeIdx (Vue)', async () => {
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={[]} onChange={vi.fn()} />);
    const list = screen.getByRole('listbox', { name: 'Nguồn' });
    await user.click(list);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(list.querySelector('[aria-selected="true"]')).toHaveTextContent('Vue');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('PickList — classNames slots + style', () => {
  const SOURCE = [{ label: 'One', value: 'one' }];
  const TARGET = [{ label: 'Two', value: 'two' }];

  it('slots lên đúng element: root/panel/panelTitle/list/option/controls', () => {
    render(
      <PickList
        source={SOURCE}
        target={TARGET}
        classNames={{ root: 'slot-root', panel: 'slot-panel', panelTitle: 'slot-title', list: 'slot-list', option: 'slot-opt', controls: 'slot-controls' }}
      />,
    );
    expect(document.querySelector('div.slot-root')).not.toBeNull();
    expect(document.querySelectorAll('.slot-panel').length).toBe(2);
    expect(screen.getByText('Nguồn')).toHaveClass('slot-title');
    expect(document.querySelectorAll('ul.slot-list').length).toBe(2);
    expect(screen.getByText('One')).toHaveClass('slot-opt');
    expect(document.querySelector('.slot-controls')).not.toBeNull();
  });

  it('style passthrough lên root; className người dùng sau root slot', () => {
    const { container } = render(
      <PickList source={SOURCE} target={TARGET} style={{ padding: '2px' }} classNames={{ root: 'slot-root' }} className="user-last" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveStyle({ padding: '2px' });
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
  });
});
