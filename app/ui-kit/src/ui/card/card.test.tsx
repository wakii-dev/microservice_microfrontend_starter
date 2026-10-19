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

  it('hoverable → depth contract: nhấc ele-1→ele-3 + viền đậm 20% + dịch 1px, ease-smooth', () => {
    render(
      <Card hoverable className="marker">
        <span>x</span>
      </Card>,
    );
    const cls = screen.getByText('x').closest('.marker')!.className;
    expect(cls).toContain('shadow-[var(--ele-1)]'); // rest ở bậc L2
    expect(cls).toContain('hover:shadow-[var(--ele-3)]');
    expect(cls).toContain('hover:border-ink/20');
    expect(cls).toContain('hover:-translate-y-px');
    expect(cls).toContain('active:shadow-[var(--ele-2)]'); // press nén bóng
    expect(cls).toContain('ease-[var(--ease-smooth)]');
  });
});

// ── Case-coverage audit 2026-10-18 (antd parity: loading + size) ──

describe('Card — loading + size (antd parity)', () => {
  it('loading → skeleton bones thay body, aria-busy, children ẩn', () => {
    render(
      <Card title="T" loading>
        <span data-testid="real-body">nội dung thật</span>
      </Card>,
    );
    expect(screen.queryByTestId('real-body')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Đang tải')).toBeInTheDocument();
    // bones: ≥3 shimmer bone (bg-s3 overflow-hidden) trong khối busy
    expect(screen.getByLabelText('Đang tải').querySelectorAll('.bg-s3').length).toBeGreaterThanOrEqual(3);
  });

  it('size="small" → padding dense (head + body + actions 12px)', () => {
    render(
      <Card title="S" size="small" actions={[<span key="a">act</span>]}>
        <span data-testid="small-body">x</span>
      </Card>,
    );
    const root = screen.getByTestId('small-body').closest('.rounded-xl')!;
    expect(root.innerHTML).toContain('px-3 py-2'); // head
    expect(root.innerHTML).toContain('p-3'); // body
    expect(root.innerHTML).toContain('p-2'); // action li
  });

  it('mặc định giữ padding 24 (px-6 py-4 head / p-6 body)', () => {
    render(
      <Card title="D">
        <span data-testid="d-body">x</span>
      </Card>,
    );
    const root = screen.getByTestId('d-body').closest('.rounded-xl')!;
    expect(root.innerHTML).toContain('px-6 py-4');
    expect(root.innerHTML).toContain('p-6');
  });
});
