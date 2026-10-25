// InboxThread — thread tin nhắn 2 phía (lead/worker, Team-OS): bong bóng lead
// phải (accent) · worker trái (s2) + dấu (delivered) + timestamp relative +
// input gửi nhanh controlled (Input + Button, Enter cũng gửi).
// Depth: panel ele-1/wash; bong bóng transition ease-smooth.
import { useState, type FormEvent } from 'react';
import { Button } from '../../button/index';
import { Icon } from '../../icons/index.js';
import { Input } from '../../input/index.js';
import { relTime } from '../ping-feed/index.js';

export interface ThreadMessage {
  /** Thời điểm (Date | ISO). */
  at: string | Date;
  /** Người gửi — 'lead' bubble phải accent, còn lại trái (bg-s2). */
  from: 'lead' | (string & {});
  /** Người nhận (hiển thị meta). */
  to: string;
  body: string;
  /** Đã giao tới terminal người nhận — hiện dấu (delivered). */
  delivered?: boolean;
}

export interface InboxThreadProps {
  messages: ThreadMessage[];
  /** Controlled text ô nhập; không truyền → uncontrolled nội bộ. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Gửi tin — nhận text hiện tại; parent thêm vào messages. */
  onSend?: (text: string) => void;
  /** Góc nhìn: bubble của `viewer` nằm phải (accent); bubble còn lại trái. */
  viewer?: string;
  className?: string;
}

export function InboxThread({ messages, value, defaultValue = '', onChange, onSend, viewer = 'lead', className }: InboxThreadProps) {
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;

  function send(e?: FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    // controlled: parent tự clear qua value; uncontrolled: clear nội bộ
    if (value === undefined) setInner('');
  }

  return (
    <section
      className={`flex min-h-0 flex-col rounded-xl border border-line bg-s1 shadow-[var(--ele-1)] [background-image:var(--wash)] transition-[box-shadow] duration-[240ms] ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)]${
        className ? ` ${className}` : ''
      }`}
      aria-label="Inbox thread"
    >
      <ol className="m-0 flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto p-4">
        {messages.map((m, i) => {
          const mine = m.from === viewer;
          return (
            <li key={i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <p className="m-0 text-meta text-ink3">
                <span className="font-semibold text-ink2">{m.from}</span> → {m.to} · {relTime(m.at)}
              </p>
              <div
                className={`mt-0.5 max-w-[85%] rounded-xl px-3 py-2 text-body transition-colors duration-[240ms] ease-[var(--ease-smooth)] ${
                  mine ? 'rounded-br-sm bg-accent/12 text-ink' : 'rounded-bl-sm border border-line2 bg-s2 text-ink'
                }`}
              >
                {m.body}
                {m.delivered && (
                  <span className="ml-2 inline-flex items-center gap-0.5 align-middle text-meta text-st-done">
                    <Icon aria-hidden={true} name="check" size={10} />
                    delivered
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <form
        className="flex items-center gap-2 border-t border-line2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="min-w-0 flex-1">
          <Input
            aria-label="Tin nhắn"
            placeholder={`Nhắn ${viewer === 'lead' ? 'worker' : 'lead'}…`}
            value={text}
            onChange={(e) => {
              onChange?.(e.target.value);
              if (value === undefined) setInner(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
        </div>
        <Button type="primary" aria-label="Gửi tin nhắn" onClick={() => send()} className="whitespace-nowrap">
          <Icon aria-hidden={true} name="arrow-right" size={14} />
          Gửi
        </Button>
      </form>
    </section>
  );
}
