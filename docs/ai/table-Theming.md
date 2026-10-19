# Theming & Hooks — when to use

Group: theming-hooks (worker F). Source of truth: `app/ui-kit/src/provider/` + `app/ui-kit/src/hooks/`.
Merge target: AGENTS.md (coordinator-owned — do not edit AGENTS.md directly).

| Component | Use when | Power props/combo |
|---|---|---|
| `UiKitProvider` | Scope a theme subtree — dark mode or runtime token overrides with zero re-render | `theme`: `'dark'` or object `{ accent, accentHi, canvas, s1/s2/s3, ink/ink2/ink3, line, done/doing/fail }` (13 keys → CSS vars cascade to descendants) · `accent`/`accentHover` shorthand for one-line brand swap · wrap app root or a single panel |
| `useForm` | Form state + zod validation with a minimal RHF-style API | `schema` (zod = source of truth) · `mode`: `'onSubmit' \| 'onBlur' \| 'onChange'` · errors land on `errors.field`, auto-focus first `[name]` invalid · combo: `Field` + `Input` + `Button` |
| `useClickAway` | Close on outside interaction — dropdown, popover, menu | returned `ref` attaches to the "inside" element · handler via ref (no re-bind) · combo: `Dropdown`/`Menu`/custom popover |
| `useFocusTrap` | Lock Tab focus inside a dialog; restore focus to trigger on close | `(ref, active)` — focuses first focusable (or container), cycles Tab, restores on deactivate · combo: `Modal`/`Drawer` (built in) or any custom `role="dialog"` |
| `useCopyToClipboard` | Copy-to-clipboard with user feedback | returned `[copiedText, copy]` — `copy(text)` → boolean success · combo: `Button` + "Copied!" flash, input copy affordance |
| `useCountdown` | Ticking countdown — OTP resend, cooldown lock | `initialSeconds` (+ `intervalMs`) → `{ remaining, restart, … }` · combo: `Button` disabled while counting |
| `useDebounce` | Delayed value — search-as-you-type, expensive derivations | `delayMs` (default 500) · combo: `Input` search → `Table`/`List` filter, API calls |
| `useThrottle` | Rate-limited value — scroll/resize/infinite-scroll handlers | `intervalMs` (default 500) · combo: `useWindowSize` consumers, scroll triggers |
| `useTimeout` | Component-safe timeout effect | `callback` + `delayMs` → `{ start, clear, … }` · combo: toast auto-dismiss, tooltip delays |
| `useToggle` | Boolean on/off state | `initialValue` → `[value, toggle]` · combo: `Collapse` custom triggers, sidebar collapsed, any show/hide |
| `useDefault` | State that falls back to a default when value is undefined | `defaultValue` · combo: controlled/uncontrolled bridge, form field fallbacks |
| `usePrevious` | Value from the previous render | single arg · combo: change detection in effects, transition diffs |
| `useHover` | Hover state without CSS — JS-driven visuals | returned `ref` · combo: drag handles, canvas-like interactions CSS can't express |
| `useKeyPress` | Reactive "is key pressed" + optional callback | `targetKey` (`'Escape'`, `'Enter'`…) + `onPress` · combo: ESC-close handlers (dialogs have it built in), shortcut hints |
| `useLockBodyScroll` | Prevent background scroll while open | `locked` (default true) · combo: `Modal`/`Drawer` (built in), fullscreen previews |
| `useMediaQuery` | Reactive matchMedia boolean, updates in real time | `query` (e.g. `'(min-width: 768px)'`) · combo: responsive JS behavior, `prefers-reduced-motion` branches |
| `useWindowSize` | Live viewport width/height | no args · combo: virtualized lists, breakpoint-adjacent JS logic |
| `useLocalStorage` / `useSessionStorage` | Persistent (tab) / session state without effect boilerplate | `key` + `initialValue` · combo: theme preference, drafts, wizard step memory |
