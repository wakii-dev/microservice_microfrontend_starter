// Editor peer-dep — test fallback (Tiptap chưa cài trong test env).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from './index.js';
afterEach(cleanup);

describe('Editor', () => {
  it('fallback khi Tiptap chưa cài', () => {
    render(<Editor fallback={<p>Cài Tiptap</p>} />);
    expect(screen.getByText(/Cài Tiptap/)).toBeInTheDocument();
  });
  it('loading state trước khi resolve', () => {
    render(<Editor />);
    expect(screen.getByText(/Đang tải/)).toBeInTheDocument();
  });
});
