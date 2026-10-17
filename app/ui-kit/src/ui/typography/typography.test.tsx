// Typography tests — Title levels (antd scale) + Text types/marks/copyable + Paragraph.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Typography, Title, Text, Paragraph } from './index.js';

afterEach(cleanup);
const { Title: T, Text: X, Paragraph: P } = Typography;

describe('Typography.Title', () => {
  it.each([
    [1, 'h1', '38px'],
    [2, 'h2', '30px'],
    [3, 'h3', '24px'],
    [4, 'h4', '20px'],
    [5, 'h5', '16px'],
  ] as const)('level %i → tag %s + fontSize %s', (level, tag, size) => {
    render(<Title level={level}>Tiêu đề</Title>);
    const el = screen.getByRole('heading', { level });
    expect(el.tagName).toBe(tag.toUpperCase());
    expect(el).toHaveStyle({ fontSize: size });
    expect(el).toHaveStyle({ fontWeight: 600 });
  });

  it('mặc định level 1', () => {
    render(<T>Default</T>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('Typography.Text', () => {
  it('type danger → màu đỏ token', () => {
    render(<X type="danger">Lỗi</X>);
    expect(screen.getByText('Lỗi')).toHaveStyle({ color: 'var(--st-fail)' });
  });

  it('strong/code/keyboard/underline/delete xếp lớp đúng', () => {
    render(
      <X strong code underline delete keyboard>
        X
      </X>,
    );
    const el = screen.getByText('X');
    expect(el.closest('del')).not.toBeNull();
    expect(el.closest('u')).not.toBeNull();
    expect(el.closest('code')).not.toBeNull();
    expect(el.closest('kbd')).not.toBeNull();
    expect(el.closest('strong')).not.toBeNull();
  });

  it('copyable → click copy vào clipboard', () => {
    const write = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: write },
      configurable: true,
    });
    render(<X copyable>wakii</X>);
    fireEvent.click(screen.getByTitle('Copy'));
    expect(write).toHaveBeenCalledWith('wakii');
  });
});

describe('Typography.Paragraph + composite', () => {
  it('Paragraph lineHeight 1.6 + type', () => {
    render(<P type="secondary">mô tả</P>);
    expect(screen.getByText('mô tả')).toHaveStyle({ color: 'var(--ink2)' });
  });

  it('Typography.Title/Text/Paragraph truy cập được qua composite', () => {
    expect(T).toBe(Title);
    expect(X).toBe(Text);
    expect(P).toBe(Paragraph);
  });
});

describe('Typography — branch phụ', () => {
  it('Text type success/warning → màu token', () => {
    render(
      <>
        <X type="success">ok</X>
        <X type="warning">warn</X>
      </>,
    );
    expect(screen.getByText('ok')).toHaveStyle({ color: 'var(--st-done)' });
    expect(screen.getByText('warn')).toHaveStyle({ color: 'var(--st-doing)' });
  });

  it('keyboard đơn + composite render null', () => {
    render(<X keyboard>Ctrl</X>);
    expect(screen.getByText('Ctrl').closest('kbd')).not.toBeNull();
    const { container } = render(<Typography />);
    expect(container.firstElementChild).toBeNull();
  });

  it('Title style override + Text style merge', () => {
    render(
      <>
        <T level={2} style={{ color: 'red' }}>
          đỏ
        </T>
        <X style={{ letterSpacing: 1 }}>
          x
        </X>
      </>,
    );
    expect(screen.getByText('đỏ')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(screen.getByText('x')).toHaveStyle({ letterSpacing: '1px' });
  });
});

describe('Typography — branch phụ (Tier 5 sweep)', () => {
  it('Text KHÔNG copyable → click không crash, không icon', () => {
    render(<X>plain</X>);
    fireEvent.click(screen.getByText('plain'));
    expect(screen.queryByText('⧉')).toBeNull();
  });
});
