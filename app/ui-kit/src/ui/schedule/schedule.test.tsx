// Schedule peer-dep — test fallback path (mock reject: consumer CHƯA cài).
// Đường FC THẬT (đã cài trong devDeps) test ở schedule.fc.test.tsx — tách file
// vì vi.mock hoist cấp file.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
// Mock reject để mô phỏng consumer CHƯA cài (peer-dep fallback path)
vi.mock('@fullcalendar/core', async () => { throw new Error('not installed'); });
vi.mock('@fullcalendar/daygrid', async () => { throw new Error('not installed'); });
vi.mock('@fullcalendar/interaction', async () => { throw new Error('not installed'); });
import { Schedule } from './index.js';
afterEach(cleanup);

describe('Schedule — fallback (chưa cài @fullcalendar/*)', () => {
  it('fallback tuỳ chỉnh render khi import fail', async () => {
    render(<Schedule fallback={<p>Cài FullCalendar</p>} />);
    expect(await screen.findByText(/FullCalendar/, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('không truyền fallback → text mặc định hướng dẫn cài', async () => {
    render(<Schedule />);
    expect(await screen.findByText(/Cài @fullcalendar\/core/, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('events + onEventClick truyền vào → vẫn fallback, không crash', async () => {
    const onEventClick = vi.fn();
    render(
      <Schedule
        events={[{ id: 'e1', title: 'X', start: '2026-10-18' }]}
        onEventClick={onEventClick}
        fallback={<p>chưa cài</p>}
      />,
    );
    expect(await screen.findByText('chưa cài', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(onEventClick).not.toHaveBeenCalled();
  });
});
