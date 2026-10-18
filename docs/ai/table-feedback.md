# Feedback & Overlay — when to use (group H)

Source: `app/ui-kit/src/ui/*` real props. 14 components. Merge target: `AGENTS.md` section "Feedback & Overlay — khi nào dùng".

| Component | Use when | Power props/combo |
|---|---|---|
| `Alert` | Inline status banner that stays in the page flow (not transient) — filled by default, `outlined` for the tinted look | `type` (`success\|info\|warning\|error`) · `variant="outlined"` · `description` detail line · `closable`+`onClose` dismissible · `classNames` slots (antd v5) |
| `BlockUI` | Lock a region in place while it is busy — scrim + centered label over the wrapped content | `blocked` toggle · `message` label on the scrim · wrap `Table`/`Card` during fetch · pair with `Spinner` outside the lock |
| `ContextMenu` | Right-click menu on a region — positioned at the pointer | `items` (key `'---'` = divider, `danger`/`disabled` per item) · `onItemClick` switch by key · arrow-key nav + ESC + outside-click built-in |
| `Drawer` | Side panel for detail/form without leaving the page (portal, focus trap, scroll lock) | `open`+`onClose` (ESC, mask click, × wired) · `width` (default 378 antd) · `footer` action row · `classNames` slots |
| `Dropdown` | Button-triggered action menu — role=menu with full keyboard nav | `items` + `onItemClick` · `trigger` = `Button` · `'---'` divider · `danger`/`disabled` per item · ArrowUp/Down/Home/End built-in |
| `Message` | Transient global toast — static API, 3s auto-dismiss, no React state needed | `message.success\|info\|warning\|error(content)` · `classNames` slots (wrapper/icon/content) |
| `Modal` | Blocking confirm/dialog on top of the page (portal, focus trap, scroll lock) | `open` + `onOk`/`onCancel` (ESC + mask + × all cancel) · `danger` red OK · `confirmLoading` locks both buttons · `okText`/`cancelText` · `classNames` slots |
| `Notification` | Rich toast with title + description — static API, 4.5s, manual × close | `notification.success(title, description?)` · `classNames` slots (wrapper/title/content) |
| `Popconfirm` | Confirm bubble anchored to a trigger (delete guard) — ESC = cancel, role=dialog | `open` (controlled) + `onConfirm`/`onCancel` · `danger` red icon/OK · `title` + `description` · `okText`/`cancelText` |
| `Progress` | Line progress bar with % readout — values clamped to 0–100 | `percent` · `status="exception\|success"` recolors bar (red/green) · `showInfo={false}` hides % |
| `Result` | Full-area status page — icon + color + default title per status | `status` (`success\|error\|info\|warning\|404\|500`) · `title`/`subTitle` override · `extra` action buttons |
| `Skeleton` | Loading placeholder bones with shimmer wave | `variant` (`text\|row\|card\|circle\|button`) · `count` repeats a bone · compose circle+text+row for a loading card · `classNames` slots (wrapper/bone) |
| `Spinner` | Inline busy indicator — 3 variants, label is the required accessible name | `label` (REQUIRED aria-label) · `variant` (`ring\|dots\|bars`) · `size` sm/md/lg · `color` (`inverse` on dark surfaces) |
| `Tooltip` | Hover/focus hint bubble (top/bottom) — portal-free, wraps the trigger in place | `title` (bubble content) · `placement="top\|bottom"` · `aria-describedby` auto-wired · ESC dismisses |
