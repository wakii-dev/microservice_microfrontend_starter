// Smoke test mẫu — render Home không crash + đúng tiêu đề. Pattern cho test
// component: RTL render → truy vấn theo role/text → assert matcher jest-dom.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './home';

describe('HomePage', () => {
  it('render tiêu đề chào mừng với tên app (placeholder thay khi scaffold)', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('{{appName}}');
  });
});
