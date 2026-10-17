// Schedule peer-dep — test fallback (FullCalendar chưa cài trong test env).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
// Engine đã vào devDeps → mock reject để mô phỏng consumer CHƯA cài (peer-dep fallback path)
vi.mock('@fullcalendar/core', async () => { throw new Error('not installed'); });
import { Schedule } from './index.js';
afterEach(cleanup);

describe('Schedule', () => {
  it('fallback khi FullCalendar chưa cài', async () => {
    render(<Schedule fallback={<p>Cài FullCalendar</p>} />);
    expect(await screen.findByText(/FullCalendar/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
