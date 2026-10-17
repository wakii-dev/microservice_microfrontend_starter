import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ScrollTop } from './index.js';
afterEach(cleanup);
describe('ScrollTop', () => {
  it('scrollY < threshold → ẩn', () => {
    const { container } = render(<ScrollTop />);
    expect(container.firstElementChild).toBeNull();
  });
});
