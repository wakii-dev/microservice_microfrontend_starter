// Accordion tests — single-open mặc định (mở cái kia TỰ ĐÓNG cái trước), multiple,
// controlled activeKey (string|string[]), onChange payload theo mode, disabled,
// chevron rotate, a11y wiring (aria-expanded/controls + region labelledby).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Accordion } from './index.js';

const ITEMS = [
  { key: 'a', label: 'Panel A', children: 'Body A' },
  { key: 'b', label: 'Panel B', children: 'Body B' },
  { key: 'c', label: 'Panel C', children: 'Body C', disabled: true },
];

afterEach(cleanup);

describe('Accordion', () => {
  it('render items; mặc định tất cả đóng', () => {
    render(<Accordion items={ITEMS} />);
    expect(screen.getByText('Panel A')).toBeInTheDocument();
    expect(screen.getByText('Body A')).toBeInTheDocument(); // trong DOM (track 0fr — clip)
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('single-open mặc định: mở B → A TỰ ĐÓNG (semantics Accordion)', () => {
    render(<Accordion items={ITEMS} defaultActiveKey="a" />);
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Panel B' }));
    expect(screen.getByRole('button', { name: 'Panel B' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('bấm panel đang mở (single) → đóng; không panel nào mở', () => {
    render(<Accordion items={ITEMS} defaultActiveKey="a" />);
    fireEvent.click(screen.getByRole('button', { name: 'Panel A' }));
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('multiple=true: A + B mở CÙNG LÚC', () => {
    render(<Accordion items={ITEMS} multiple defaultActiveKey={['a']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Panel B' }));
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Panel B' })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Panel B' }));
    expect(screen.getByRole('button', { name: 'Panel B' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('controlled activeKey (string) → panel theo prop; click KHÔNG tự đổi — chỉ bắn onChange', () => {
    const onChange = vi.fn();
    render(<Accordion items={ITEMS} activeKey="a" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Panel B' }));
    expect(onChange).toHaveBeenCalledWith('b'); // payload single = string
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'true'); // vẫn theo prop
  });

  it('controlled multiple: activeKey string[] + payload string[]', () => {
    const onChange = vi.fn();
    render(<Accordion items={ITEMS} multiple activeKey={['a', 'b']} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Panel A' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Panel B' })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Panel B' }));
    expect(onChange).toHaveBeenCalledWith(['a']); // b bị remove khỏi Set
  });

  it('uncontrolled onChange: single payload string, toggle đóng → rỗng', () => {
    const onChange = vi.fn();
    render(<Accordion items={ITEMS} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Panel A' }));
    expect(onChange).toHaveBeenLastCalledWith('a');
    fireEvent.click(screen.getByRole('button', { name: 'Panel A' }));
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('disabled item: click không toggle, header cursor-not-allowed', () => {
    render(<Accordion items={ITEMS} />);
    const c = screen.getByRole('button', { name: 'Panel C' });
    expect(c).toBeDisabled();
    fireEvent.click(c);
    expect(c).toHaveAttribute('aria-expanded', 'false');
    expect(c.className).toContain('cursor-not-allowed');
  });

  it('chevron xoay khi mở + a11y: aria-controls ↔ region id + region labelledby header', () => {
    render(<Accordion items={ITEMS} defaultActiveKey="a" />);
    const header = screen.getByRole('button', { name: 'Panel A' });
    expect(header).toHaveAttribute('aria-controls', 'accordion-panel-a');
    const chevron = header.lastElementChild as HTMLElement;
    expect(chevron.className).toContain('rotate-180');
    const region = document.getElementById('accordion-panel-a')!;
    expect(region).toHaveAttribute('role', 'region');
    expect(region).toHaveAttribute('aria-labelledby', 'accordion-header-a');
    // 3 tầng grid: padding nằm SẠCH tầng clip (chống padding-leak V2)
    const clip = region.firstElementChild as HTMLElement;
    expect(clip.className).toContain('min-h-0');
    expect(clip.className).toContain('overflow-hidden');
    expect((clip.firstElementChild as HTMLElement).className).toContain('px-4');
  });
});
