// Result tests — status icon/title mặc định + title/subTitle/extra override.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Result } from './index.js';

afterEach(cleanup);

describe('Result', () => {
  it('success → icon tick + title mặc định', () => {
    render(<Result status="success" />);
    expect(screen.getByText('Thành công')).toBeInTheDocument();
  });

  it('title/subTitle/extra override + children', () => {
    render(
      <Result status="404" title="404" subTitle="Trang không tồn tại" extra={<button>Về chủ</button>}>
        <p>detail</p>
      </Result>,
    );
    expect(screen.getAllByText('404').length).toBeGreaterThanOrEqual(1); // icon + title đều "404"
    expect(screen.getByText('Trang không tồn tại')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về chủ' })).toBeInTheDocument();
  });
});
