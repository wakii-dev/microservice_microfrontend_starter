# Forms — when to use (group E)

Source: `app/ui-kit/src/ui/*` real props. 20 components. Merge target: `AGENTS.md` section "Forms — khi nào dùng".

| Component | Use when | Power props/combo |
|---|---|---|
| `AutoComplete` | Free-text input with type-to-filter suggestions (search-as-type) | `suggestions` · `onChange` raw text + `onSelect` picked value · empty `suggestions` → dropdown never opens · `Field` wrap |
| `Calendar` | Month grid for inline date browsing/picking (no trigger field) | `value` + `onChange` controlled day · `locale="vi"\|"en"` · `range` + `onDayHover` (drives DatePicker) · `bare` inside panels |
| `CascadeSelect` | Hierarchical pick (region → city → ward) through expanding panel columns | `options` nested `children` define levels · `value` is a path array `["hn","bd"]` · keyboard ↑↓/Enter/Esc built into the trigger |
| `Checkbox` | Single on/off decision with a visible label | `checked` + `onChange(bool)` · `disabled` · inside `Field` — prefer `Switch` for instant-apply settings |
| `Chips` | Multi-value tag input — Enter adds, × removes, Backspace pops the last | `value: string[]` + `onChange` · `placeholder` hint · `disabled` hides input + remove buttons · duplicates ignored |
| `ColorPicker` | Color choice: swatch + preset grid + native picker + hex field | `presets` curated palette (`[]` = native + hex only) · `value` hex · `onChange` fires from preset/native/hex alike |
| `DatePicker` | Date pick through a trigger + calendar panel | `range` + `showTime` + `locale` vi/en · `value: Date \| [Date, Date]` · `now` injectable for tests · `prefix` icon · footer "Today"/OK |
| `Inplace` | Click-to-edit inline value (read mode → edit form → close) | `display` + `children` (the edit form) · `onClose` after closing · pair `Input`/`Textarea` inside |
| `InputMask` | Constrained format typing — `9`=digit, `a`=letter, `*`=alnum, others literal | `mask` · `placeholder` showing the format · `ariaLabel` for accessible name · typing past an invalid char just stops |
| `InputNumber` | Numeric input with vertical stepper + ↑↓ + min/max clamp | `min`/`max`/`step` · `invalid` red border · blur snaps the display to the clamp · `value` is read at mount (uncontrolled internal) |
| `InputOTP` | N single-char cells with auto-advance + multi-cell paste | `length` · `value`/`onChange` as one joined string · `ariaLabel` per cell ("code 1…") · digits only · Backspace walks back |
| `Mention` | Textarea with @-triggered mention list | `suggestions` filtered by the text after @ · ↑↓ + Enter/Esc keyboard pick · picks insert `"@Name "` · `value`/`onChange` is the full text |
| `Password` | Password field with show/hide toggle (+ optional strength meter) | `showStrength` meter with --st-* colors · `ariaLabel` · `value`/`onChange` · wraps `Input` |
| `PickList` | Two-column transfer (source ⇄ target) | `source`/`target` + `onChange(source, target)` · multi-pick then chevron move · each listbox keyboard-navigable (↑↓ + Enter/Space) · `aria-multiselectable` |
| `Radio`/`RadioGroup` | Single choice among a few always-visible options | `RadioGroup options` + `value` · per-option `disabled` · standalone `Radio` for one-offs · prefer `Select` when options are many |
| `Slider` | Numeric pick on a track — single value or a range | `range: [lo, hi]` + `onRangeChange` · `step` snapping · keyboard ←↓/→↑ clamped · `ariaLabel` required (`role="slider"`) |
| `Switch` | Instant on/off setting toggle | `checked` + `onChange` · `size="small"` for dense rows · inside `Field`/settings `Tabs` · `role="switch"` + `aria-checked` built-in |
| `TimePicker` | HH:mm pick via stepper panel (+ "Now" shortcut) | `value` Date keeps its date-part on change, string `"HH:mm"` emits epoch-day · `locale` vi/en · `now` injectable for tests · pairs with `DatePicker` `showTime` |
| `ToggleButton` | Button with a pressed state (on/off action) | `checked` exposed as `aria-pressed` · `disabled` · clusters of toggles (filters/view switches) · unchecked = default variant look |
| `TreeSelect` | Pick a LEAF from a hierarchy, with search + clear | `treeData` nested `children` (parents are headers, not pickable) · `searchable` filters by label/path · `clearable` × resets · trigger shows the `"A / B"` path |
