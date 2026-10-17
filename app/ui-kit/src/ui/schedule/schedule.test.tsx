// Schedule peer-dep — test fallback (FullCalendar chưa cài trong test env).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Schedule } from './index.js';
afterEach(cleanup);

describe('Schedule', () => {
  it('fallback khi FullCalendar chưa cài', () => {
    render(<Schedule fallback={<p>Cài FullCalendar</p>} />);
    expect(screen.getByText(/FullCalendar/)).toBeInTheDocument();
  });
});
