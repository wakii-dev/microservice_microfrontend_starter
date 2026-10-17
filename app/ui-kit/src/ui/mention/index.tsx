// Mention — @autocomplete trong textarea (lite: trigger @ + suggestion list).
import { useRef, useState } from 'react';

export interface MentionProps {
  value?: string;
  onChange?: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export function Mention({ value: valueProp, onChange, suggestions = [], placeholder, className }: MentionProps) {
  const [internal, setInternal] = useState('');
  const value = valueProp ?? internal;
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  const matches = mentionQuery !== null
    ? suggestions.filter((s) => s.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
    : [];

  function detectMention(text: string, pos: number) {
    const before = text.slice(0, pos);
    const match = before.match(/@(\w*)$/);
    if (match) { setMentionStart(pos - match[0].length); setMentionQuery(match[1]); }
    else setMentionQuery(null);
  }

  function selectMention(name: string) {
    if (!ref.current) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(ref.current.selectionStart);
    const next = `${before}@${name} ${after}`;
    setInternal(next); onChange?.(next); setMentionQuery(null);
    ref.current.focus();
  }

  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <textarea
        ref={ref} value={value} placeholder={placeholder}
        className="w-full rounded-2 border border-line bg-s2 p-3 text-body text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
        onChange={(e) => { setInternal(e.target.value); onChange?.(e.target.value); detectMention(e.target.value, e.target.selectionStart); }}
      />
      {mentionQuery !== null && matches.length > 0 && (
        <ul className="absolute z-30 m-0 list-none rounded-3 border border-line bg-s2 p-1 shadow-[var(--shadow-pop)]" style={{ bottom: '100%', left: 0 }}>
          {matches.map((s) => (
            <li key={s}>
              <button type="button" className="w-full cursor-pointer rounded-2 border-none bg-transparent px-3 py-1.5 text-left text-body text-ink hover:bg-s3"
                onClick={() => selectMention(s)}>@{s}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
