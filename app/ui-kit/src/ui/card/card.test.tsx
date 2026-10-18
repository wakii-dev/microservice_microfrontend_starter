// Card tests — head/body/extra/actions/hoverable/bordered.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Card } from './index.js';

afterEach(cleanup);

describe('Card', () => {
  it('bordered mặc định + title head + body padding', () => {
    render(
      <Card title="Card tiêu đề" extra={<a>Thêm</a>} className="marker">
        Nội dung
      </Card>,
    );
    const card = screen.getByText('Nội dung').closest('.marker')!;
    expect(card).toHaveClass('border-line');
    expect(screen.getByText('Card tiêu đề')).toBeInTheDocument();
    expect(screen.getByText('Thêm')).toBeInTheDocument();
  });

  it('hoverable → shadow utility class', () => {
    render(
      <Card hoverable className="marker">
        <span>x</span>
      </Card>,
    );
    expect(screen.getByText('x').closest('.marker')!.className).toContain('hover:shadow');
  });

  it('bordered=false → không border class', () => {
    render(
      <Card bordered={false} className="marker">
        <span>y</span>
      </Card>,
    );
    expect(screen.getByText('y').closest('.marker')!.className).not.toContain('border-line');
  });

  it('actions → ul phân cách border-l giữa các action', () => {
    render(
      <Card actions={[<span key="1">A</span>, <span key="2">B</span>]}>
        <span>body</span>
      </Card>,
    );
    expect(screen.getByText('B').parentElement).toHaveClass('border-l');
    expect(screen.getByText('A').parentElement).not.toHaveClass('border-l');
  });

  it('cover → render TRƯỚC head (banner trên title)', () => {
    render(
      <Card title="T" cover={<div data-testid="cover" />}>
        <span>body</span>
      </Card>,
    );
    const card = screen.getByTestId('cover').parentElement!;
    const first = card.firstElementChild;
    expect(first).toHaveAttribute('data-testid', 'cover');
    // head (title) nằm sau cover
    expect(card.textContent).toContain('T');
  });

  it('actions=[] → không render ul (không hàng rỗng)', () => {
    const { container } = render(
      <Card actions={[]} title="T">
        <span>body</span>
      </Card>,
    );
    expect(container.querySelector('ul')).toBeNull();
  });

  it('không title/extra → không head, body là nội dung đầu', () => {
    const { container } = render(
      <Card>
        <span data-testid="only-body">x</span>
      </Card>,
    );
    expect(screen.queryByText('T')).toBeNull();
    expect(container.firstElementChild).not.toHaveClass('border-b');
    expect(screen.getByTestId('only-body')).toBeInTheDocument();
  });

  it('hoverable → đầy đủ hover lift (bg-s3 + shadow + translate, style matrix)', () => {
    render(
      <Card hoverable className="marker">
        <span>x</span>
      </Card>,
    );
    const cls = screen.getByText('x').closest('.marker')!.className;
    expect(cls).toContain('hover:bg-s3');
    expect(cls).toContain('hover:shadow-[var(--shadow-lift)]');
    expect(cls).toContain('hover:-translate-y-px');
  });
});
