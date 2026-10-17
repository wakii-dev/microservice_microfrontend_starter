// Editor peer-dep — test fallback (Tiptap chưa cài trong test env).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
// Engine đã vào devDeps → mock reject để mô phỏng consumer CHƯA cài (peer-dep fallback path)
vi.mock('@tiptap/react', async () => { throw new Error('not installed'); });
vi.mock('@tiptap/starter-kit', async () => { throw new Error('not installed'); });
import { Editor } from './index.js';
afterEach(cleanup);

describe('Editor', () => {
  it('fallback khi Tiptap chưa cài', async () => {
    render(<Editor fallback={<p>Cài Tiptap</p>} />);
    expect(await screen.findByText(/Cài Tiptap/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
  it('loading state trước khi resolve', () => {
    render(<Editor />);
    expect(screen.getByText(/Đang tải/)).toBeInTheDocument();
  });
});
