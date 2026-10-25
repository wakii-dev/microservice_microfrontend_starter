// Breadcrumb tests — items + separator + last plain + href link.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Breadcrumb } from './index.js';

afterEach(cleanup);

describe('Breadcrumb', () => {
  it('href → link; cuối → plain text không link; separator /', () => {
    render(
      <Breadcrumb
        items={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Tasks', href: '/tasks' },
          { title: 'Task A' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Task A').tagName).toBe('SPAN');
    expect(screen.getAllByText('/').length).toBe(2);
  });
});

describe('Breadcrumb — branch phụ', () => {
  it('item giữa KHÔNG href → plain span (không link)', () => {
    render(
      <Breadcrumb
        items={[
          { title: 'A', href: '/a' },
          { title: 'B' },
          { title: 'C', href: '/c' },
          { title: 'D — hiện tại' },
        ]}
      />,
    );
    expect(screen.getByText('B').tagName).toBe('SPAN');
    expect(screen.getByRole('link', { name: 'C' })).toBeInTheDocument();
    expect(screen.getByText('D — hiện tại').tagName).toBe('SPAN');
  });
});

describe('Breadcrumb — branch phụ (Tier 5 sweep)', () => {
  it('separator aria-hidden giữa items', () => {
    render(<Breadcrumb items={[{ title: 'A' }, { title: 'B' }]} />);
    const sep = screen.getAllByText('/');
    sep.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });
});
