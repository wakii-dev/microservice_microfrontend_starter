// AutoComplete — Select editable standalone: input + suggestion dropdown.
import { useId, useState } from 'react';

export interface AutoCompleteOption { label: string; value: string }

export interface AutoCompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  suggestions?: AutoCompleteOption[];
  placeholder?: string;
  className?: string;
}

export function AutoComplete({ value: valueProp, onChange, onSelect, suggestions = [], placeholder, className }: AutoCompleteProps) {
  const [internal, setInternal] = useState('');
  const [open, setOpen] = useState(false);
  const value = valueProp ?? internal;
  const listId = useId();

  const matches = value && open
    ? suggestions.filter((s) => s.label.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className={`relative inline-flex w-full${className ? ` ${className}` : ''}`}>
      <input
        aria-label="Autocomplete" role="combobox" aria-expanded={matches.length > 0} aria-controls={listId}
        value={value} placeholder={placeholder}
        onChange={(e) => { setInternal(e.target.value); onChange?.(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
          if (e.key === 'Escape') setOpen(false);
        }}
        className="h-8 w-full rounded-lg border border-line bg-s2 px-3 text-body text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
      />
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" className="absolute left-0 top-full z-[var(--z-popover)] m-0 mt-1 w-full origin-top list-none overflow-hidden rounded-xl border border-line bg-s2 shadow-[var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]">
          {matches.map((s) => (
            <li key={s.value} role="option" aria-selected={value === s.value}>
              <button type="button"
                onClick={() => { setInternal(s.label); onSelect?.(s.value); setOpen(false); }}
                className={`w-full cursor-pointer border-none bg-transparent px-3 py-1.5 text-left text-body text-ink hover:bg-s3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${value === s.value ? 'bg-s3 font-medium' : ''}`}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
