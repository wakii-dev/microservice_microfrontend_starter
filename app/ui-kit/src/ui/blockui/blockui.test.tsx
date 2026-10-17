import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockUI } from './index.js';
afterEach(cleanup);
describe('BlockUI', () => {
  it('blocked → overlay + message', () => {
    render(<BlockUI blocked message="Đang xử lý"><span>content</span></BlockUI>);
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
  });
  it('not blocked → không overlay', () => {
    render(<BlockUI blocked={false}><span>content</span></BlockUI>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
