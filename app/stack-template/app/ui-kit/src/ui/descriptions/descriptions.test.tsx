// Descriptions tests — rows label:value + bordered variant + title.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Descriptions } from './index.js';

afterEach(cleanup);

const ITEMS = [
  { label: 'Người tạo', children: 'Alice' },
  { label: 'Trạng thái', children: 'Đang làm' },
];

describe('Descriptions', () => {
  it('rows label + value; không bordered → không bg label', () => {
    render(<Descriptions items={ITEMS} />);
    expect(screen.getByText('Người tạo')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('bordered → cell viền + bg label; title hiện', () => {
    render(<Descriptions title="Chi tiết task" items={ITEMS} bordered />);
    expect(screen.getByText('Chi tiết task')).toBeInTheDocument();
    expect(screen.getByText('Người tạo').closest('dt')).toHaveClass('bg-s3');
  });

  it('không title → không heading, chỉ dl', () => {
    const { container } = render(<Descriptions items={ITEMS} />);
    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.firstElementChild!.childElementCount).toBe(1); // dl duy nhất
  });

  it('số hàng = items.length; label trong dt, value trong dd', () => {
    render(<Descriptions items={ITEMS} />);
    const rows = screen.getAllByText(/Alice|Đang làm/);
    expect(rows).toHaveLength(2);
    expect(screen.getByText('Người tạo').closest('dt')?.tagName).toBe('DT');
    expect(screen.getByText('Alice').closest('dd')?.tagName).toBe('DD');
  });

  it('không bordered → dt mất border-r (bg-s3 giữ), dd flex-1, row border-b phân cách', () => {
    const { container } = render(<Descriptions items={ITEMS} />);
    expect(screen.getByText('Người tạo').closest('dt')).not.toHaveClass('border-r');
    expect(screen.getByText('Alice').closest('dd')).toHaveClass('flex-1');
    expect(container.querySelector('dl')!.firstElementChild).toHaveClass('border-b');
  });

  it('bordered → dt có border-r; row border kín (không border-b đơn)', () => {
    const { container } = render(<Descriptions items={ITEMS} bordered />);
    expect(screen.getByText('Người tạo').closest('dt')).toHaveClass('border-r');
    expect(container.querySelector('dl')!.firstElementChild?.className).toContain('border border-line2');
  });

  it('className passthrough lên wrapper', () => {
    const { container } = render(<Descriptions items={ITEMS} className="marker" />);
    expect(container.firstElementChild).toHaveClass('marker');
  });

  // ── Case-coverage audit 2026-10-18 (antd parity: size + colon) ──

  it('size="small" → padding p-2 + label w-32 (antd size parity)', () => {
    const { container } = render(<Descriptions items={ITEMS} size="small" />);
    expect(container.querySelector('dt')!).toHaveClass('p-2', 'w-32');
  });

  it('mặc định → padding p-3 + label w-40; colon tắt', () => {
    const { container } = render(<Descriptions items={ITEMS} />);
    expect(container.querySelector('dt')!).toHaveClass('p-3', 'w-40');
    expect(container.querySelector('dt')!.textContent).not.toContain(':');
  });

  it('colon → ":" render sau label (antd colon)', () => {
    const { container } = render(<Descriptions items={ITEMS} colon />);
    expect(container.querySelector('dt')!.textContent).toContain(':');
  });
});
