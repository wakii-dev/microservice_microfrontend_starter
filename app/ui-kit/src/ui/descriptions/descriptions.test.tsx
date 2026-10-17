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
});
