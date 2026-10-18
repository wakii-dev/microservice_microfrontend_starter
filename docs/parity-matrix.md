# Parity matrix — benchmark → ui-kit

Bảng đối chiếu component/benchmark gốc ↔ bản token hoá trong `app/ui-kit`.
"Đủ dùng" = đủ surface chính của benchmark, không đuổi 100% API. Cập nhật mỗi
batch ship (cột "Mức" ý kiến review, không phải cam kết API).

| Component | Benchmark | Mức | Ghi chú parity |
|---|---|---|---|
| Button | antd | đủ dùng | variant `type` + `htmlType` tách (type của antd = htmlType), size, danger, loading |
| Input / Textarea | antd | đủ dùng | h-8, status error = prop `invalid`, prefix/suffix affix, allowClear, size small/middle/large |
| InputNumber | PrimeReact | đủ dùng | stepper icon XẶP DỌC trong mép phải, keyboard ↑↓, clamp min/max |
| Select / MultiSelect | PrimeReact | đủ dùng | filterable, multiple chips + select-all, option groups, loading, showClear |
| AutoComplete / CascadeSelect | PrimeReact | đủ dùng | cùng ngôn ngữ Select |
| DatePicker / TimePicker | antd | đủ dùng | range + showTime, locale vi/en, TimePicker stepper Giờ/Phút |
| Calendar | PrimeReact ô vuông → ngôn ngữ nút chung | đủ dùng | states theo pagination: outline thường / accent selected / ring today / adjacent disabled; locale vi/en + range |
| Table (DataTable) | PrimeReact | đủ dùng | client-side data grid + filter + Skeleton shimmer |
| List | antd | đủ dùng | items + renderItem, loading→Skeleton, empty→EmptyState, pagination client |
| Pagination | antd | đủ dùng | item vuông 32 outline, active accent đặc + fontWeightStrong, SVG chevron, ellipsis `···` jump ±5 |
| Alert | antd | đủ dùng | **filled mặc định** (WCAG AA), `variant="outlined"` giữ look cũ |
| Menu (đa cấp) | antd | đủ dùng | vertical/horizontal, submenu ∞ cấp, auto-open selectedKey, animate grid-rows, a11y menu/menuitem |
| Menubar / ContextMenu / PanelMenu / TabMenu / SplitButton | PrimeReact | đủ dùng | họ menu navigation; ContextMenu right-click + separator |
| Sidebar | antd Layout.Sider | đủ dùng | collapsible 200↔80 icon-only, brand/footer slot, `MenuCompactContext` |
| Dropdown / Toolbar / SpeedDial / Splitter | PrimeReact | đủ dùng | navigation phụ |
| Tabs | antd/PrimeReact | đủ dùng | ARIA tabs pattern |
| Upload / UploadDropzone | antd | đủ dùng | hidden input + beforeUpload guard, drag-drop, danh sách file |
| Field | antd Form.Item (lite) | đủ dùng | label + error(role=alert)/hint, id `aria-describedby` suy từ htmlFor |
| useForm | React Hook Form (lite) + zod | đủ dùng | values/errors/touched, mode onSubmit/onBlur/onChange, focus-first-invalid; zod peer-dep |
| Icon | primeicons 7.0.0 | đủ dùng | 48 icon path data gốc, viewBox 24, fill currentColor, tree-shake import thẳng |
| Modal / Drawer / Notification / Message / Popconfirm | antd | đủ dùng | feedback family; Message static API `message.success()` |
| Tooltip | antd | đủ dùng | placement top/bottom, trigger hover + focus |
| Progress / Statistic / Result / Steps / Space / Divider / Descriptions / Collapse / Card / Breadcrumb / Image / Tag / Badge / Avatar | antd | đủ dùng | display family; Result 404/500, AvatarGroup max "+N" |
| Carousel | PrimeReact API + Swiper engine | đủ dùng | peer-dep swiper qua subpath `@wakii/ui-kit/carousel`; nút nav direct slide API (v14-safe) |
| Chart | Chart.js | đủ dùng | subpath `@wakii/ui-kit/chart` |
| Schedule | FullCalendar | đủ dùng | subpath `@wakii/ui-kit/schedule`; peer optional (fallback khi chưa cài) |
| Editor | Tiptap | đủ dùng | subpath `@wakii/ui-kit/editor` |
| TreeSelect | antd TreeSelect (lite) | đủ dùng | data cây đệ quy, chỉ chọn leaf, trigger hiện đường dẫn |
| AvatarGroup | antd Avatar.Group | đủ dùng | stack overlap `-ml-2` + ring, max → pill "+N" tooltip |
| Hooks ×16 | usehooks.com | đủ dùng | useDebounce/useThrottle/useToggle/useLocalStorage/useSessionStorage/useMediaQuery/useWindowSize/useHover/useClickAway/useKeyPress/useTimeout/useCountdown/useCopyToClipboard/usePrevious/useDefault/useLockBodyScroll |
| Skeleton / Spinner / BusyBox / EmptyState / BlockUI / ScrollTop / Segmented / Knob / Inplace / Rating / Slider / Switch / Checkbox / Radio / ToggleButton / Password / InputMask / InputOTP / Mention / Galleria / Timeline / OrderList / PickList / ColorPicker / Knob | PrimeReact | đủ dùng | Tier 1–4 (xem story từng comp) |
| Typography | antd | đủ dùng | Title level 1–5, Text type, code/keyboard/copyable; metrics antd |

## Gap vs antd + MUI + PrimeReact — kế hoạch OCD-completion (2026-10-18)

Đối chiếu catalog 3 thư viện chuẩn; "đủ dùng" ở bảng trên nghĩa là surface CHÍNH, chưa phải
toàn bộ case. Danh sách dưới = còn thiếu thật, xếp theo giá trị usage thực tế:

### P0 — dùng gần như mọi app (làm trước)

| Thiếu | Benchmark | Ghi chú |
|---|---|---|
| `Grid` (Row/Col) + `Flex` | antd Grid/Flex, MUI Grid/Stack | layout primitive nền tảng — hiện chỉ có `Space`; responsive span/gutter |
| `Popover` | antd Popover, MUI Popover, PrimeReact OverlayPanel | panel neo trigger nội dung tự do — Tooltip chỉ text, Popconfirm chỉ confirm |
| `Input.Search` | antd | variant input + nút search bên phải; filter-bar dùng liên tục |
| `Link` | MUI Link, antd Typography.Link | typography hiện KHÔNG có Link (đã verify grep) |
| `Affix` | antd | sticky wrapper cho toolbar/filter-bar |
| `Table` expandable rows | antd Table | row mở rộng chi tiết — CRUD hay dùng (đã verify chưa có) |

### P1 — app thật hay cần

| Thiếu | Benchmark | Ghi chú |
|---|---|---|
| `Anchor` | antd | scroll-spy nav cho trang docs/long-form |
| `QRCode` | antd | link thanh toán / chia sẻ (bối cảnh VN dùng nhiều) |
| `Watermark` | antd | chống copy nội dung nhạy cảm |
| `Tour` | antd | onboarding sản phẩm; kết hợp `useFocusTrap` |
| `ToggleButtonGroup` | MUI | cluster `ToggleButton` hiện chỉ đơn lẻ |
| `VirtualScroller` | PrimeReact | `Table virtual` đã có — standalone cho List dài |

### P2 — niche, chỉ làm khi có app tiêu thụ

`Dock` (PrimeReact) · `MegaMenu` (PrimeReact) · `OrganizationChart` · `TreeTable` ·
`Terminal` · `Fieldset/Panel` (Card phủ phần lớn) · `DeferredContent` · motion primitives
(`<Fade>/<Zoom>` wrapper — keyframes đã có trong tokens).

### Case-coverage OCD (song song component mới)

Mỗi component hiện có: đối chiếu trang docs antd/MUI/PrimeReact tương ứng, liệt kê
case/variant còn thiếu (vd Button `block`? Table `expandable`; Modal `centered`?) rồi bổ
sung stories EN + tests hành vi. Nguồn chân lý: docs của benchmark, KHÔNG đoán.

## Nguyên tắc token (áp cho mọi hàng)

1. **Màu**: chỉ token `--c-*`/`--ink*`/`--line*`/`--accent`/`--st-*` — không hex cứng trong component.
2. **Radius**: `rounded-lg` (8) cho control vuông; `rounded-pill` cho pill; một radius mỗi khối.
3. **Ngôn ngữ nút thống nhất** (2026-10-17): thường = transparent + `hover:bg-s3`; active/selected = `bg-accent text-white font-medium`; disabled = `text-ink3/ink4` + `cursor-not-allowed` không hover.
4. **Motion**: CSS thuần + motion tokens (`--motion-*`, `--ease-*`); animation height qua `grid-template-rows 0fr↔1fr`.
5. **Z-index**: scale token `--z-*` (dropdown < popover < modal < toast < tooltip) — không số cứng.
