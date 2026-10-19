import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InboxThread } from './index.js';

afterEach(cleanup);

const MSGS = [
  { at: new Date(Date.now() - 10 * 60000), from: 'v1', to: 'lead', body: 'Mop-up 620/620 xanh.', delivered: true },
  { at: new Date(Date.now() - 5 * 60000), from: 'lead', to: 'v1', body: 'ACK — gate xong, nhận việc mới.', delivered: false },
];

describe('InboxThread', () => {
  it('render tin: body + meta from → to + relative time', () => {
    render(<InboxThread messages={MSGS} viewer="v1" />);
    expect(screen.getByText('Mop-up 620/620 xanh.')).toBeInTheDocument();
    expect(screen.getByText('ACK — gate xong, nhận việc mới.')).toBeInTheDocument();
    expect(screen.getAllByText(/→ lead/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/phút trước/).length).toBeGreaterThan(0);
  });

  it('dấu delivered chỉ trên tin có delivered=true', () => {
    render(<InboxThread messages={MSGS} viewer="v1" />);
    expect(screen.getByText('delivered')).toBeInTheDocument();
  });

  it('controlled: value hiển thị, onSend nhận text; parent clear → ô rỗng', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<InboxThread messages={MSGS} value="hello" onChange={() => {}} onSend={onSend} viewer="v1" />);
    expect(screen.getByLabelText('Tin nhắn')).toHaveValue('hello');
    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));
    expect(onSend).toHaveBeenCalledWith('hello');
    rerender(<InboxThread messages={MSGS} value="" onChange={() => {}} onSend={onSend} viewer="v1" />);
    expect(screen.getByLabelText('Tin nhắn')).toHaveValue('');
  });

  it('uncontrolled: gõ + Enter → onSend; Enter với text rỗng không gửi', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<InboxThread messages={MSGS} onSend={onSend} viewer="lead" />);
    const input = screen.getByLabelText('Tin nhắn');
    await user.type(input, 'ping{Enter}');
    expect(onSend).toHaveBeenCalledWith('ping');
    await user.type(input, '{Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('bubble 2 phía: tin của viewer có class accent, tin kia có viền', () => {
    render(<InboxThread messages={MSGS} viewer="v1" />);
    const mine = screen.getByText('Mop-up 620/620 xanh.').closest('div');
    const theirs = screen.getByText('ACK — gate xong, nhận việc mới.').closest('div');
    expect(mine?.className).toContain('bg-accent/12');
    expect(theirs?.className).toContain('bg-s2');
  });
});
