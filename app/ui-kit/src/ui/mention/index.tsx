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
  // Keyboard nav suggestion list (↑↓ + Enter/Esc) — focus giữ trong textarea.
  const [activeIdx, setActiveIdx] = useState(0);
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
        className="w-full rounded-lg border border-line bg-s3 p-3 text-body text-ink placeholder:text-ink4 shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] focus:border-accent-hi focus:bg-s1 focus:shadow-[var(--ele-2)] focus:ring-[3px] focus:ring-accent/40 focus:outline-none"
        onChange={(e) => { setInternal(e.target.value); onChange?.(e.target.value); detectMention(e.target.value, e.target.selectionStart); setActiveIdx(0); }}
        onKeyDown={(e) => {
          if (mentionQuery !== null && matches.length > 0) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              const dir = e.key === 'ArrowDown' ? 1 : -1;
              setActiveIdx((i) => (i + dir + matches.length) % matches.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              selectMention(matches[activeIdx]);
            } else if (e.key === 'Escape') {
              setMentionQuery(null);
            }
          }
        }}
      />
      {mentionQuery !== null && matches.length > 0 && (
        <ul role="listbox" aria-label="Gợi ý mention" className="absolute z-[var(--z-popover)] m-0 origin-bottom list-none rounded-xl border border-line bg-s2 bg-[image:var(--wash)] p-1 shadow-[var(--shadow-pop),var(--ele-3)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]" style={{ bottom: '100%', left: 0 }}>
          {matches.map((s, i) => (
            <li key={s}>
              <button type="button" role="option" aria-selected={i === activeIdx}
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                className={`w-full cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body text-ink transition-colors duration-200 ease-[var(--ease-smooth)] animate-[bp-slide-up-in_240ms_var(--ease-smooth)_backwards] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${i === activeIdx ? 'bg-s3' : 'hover:bg-accent/5'}`}
                onClick={() => selectMention(s)}>@{s}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
