# Case-coverage audit — Data Display cluster (2026-10-18)

Worker V2 · đối chiếu benchmark antd / MUI / PrimeReact cho 20 component data-display.
Hành động: **bổ API + stories EN + tests hành vi** cho case benchmark quan trọng còn thiếu.
Verify: vitest cluster **23 file / 240 tests PASS** · eslint cụm **0 errors** · tsc: 0 lỗi ở file sửa.

## Bảng tổng hợp

| Component | Case benchmark (antd/MUI/PrimeReact) | Đã có trước | Đã bổ đợt này | Còn tồn + lý do |
|---|---|---|---|---|
| Avatar | src fallback onError, size/shape, icon | children/initials, src, alt, size, shape | **onError fallback** — src fail → initials (API + test `fireEvent.error` + story `BrokenSrcFallback`) | icon prop riêng (initials đủ) |
| AvatarGroup | max +N tooltip, overlap, per-avatar tooltip | đầy đủ benchmark lite | — | — |
| Badge | count, overflowCount 99+, showZero, dot, offset, status×5 + text | variant pill ×9 (task/activity) | **count mode**: `count`·`overflowCount`·`showZero`·`dot`·`offset`·`status`+`text` (API + 8 tests + 4 stories EN) | color preset tùy ý (variant map đủ hệ tokens) |
| Card | cover, actions, hoverable, loading, size, type inner, Meta | cover, actions, hoverable, bordered, extra | **`loading`** (skeleton body, aria-busy) + **`size="small"`** (dense padding) — tests + 2 stories EN | `type="inner"` (Card lồng + className đạt được), `Meta` composite — backlog |
| Carousel | autoplay, dots, navigators, keyboard, vertical, per-view, pauseOnHover | đầy đủ benchmark lite | — | effect `fade` (chỉ slide) — backlog |
| Collapse | accordion, disabled item, controlled keys, ghost | items, defaultActiveKeys | **`accordion`** + per-item **`disabled`** (tests + 2 stories EN) | controlled `activeKeys` (uncontrolled đủ recipe) · ghost/extra — backlog |
| Descriptions | bordered, colon, size, column, layout, span | bordered, title, items | **`size="small"`** + **`colon`** (tests + 1 story EN) | `column` nhiều cột + layout vertical + span — backlog lớn (ghi trong file) |
| Divider | type, dashed, orientation left/right | type, dashed, children-center | **`orientation="left|right|center"`** (tests + 1 story EN) | `plain` — giá trị thấp |
| EmptyState | title/description/action/custom image | đầy đủ benchmark lite | — | — |
| Galleria | indicators, thumbnails, fullscreen, caption, autoplay | images + dot indicators cơ bản | — | thumbnails/fullscreen/autoplay — heavy backlog |
| Image | preview, fallback onError, placeholder, group | preview overlay ✓ | — KHÔNG ĐỤNG (W8 đang viết lại stories) | fallback onError + PreviewGroup — chờ W8 xong |
| List | renderItem, pagination, loading, grid, actions/meta | renderItem, pagination, loading+EmptyState | — KHÔNG ĐỤNG (S đang thêm virtual) | grid mode — backlog |
| Segmented | options disabled, size, block | options/value/onChange | **per-option `disabled`** (test hành vi; stories bị giữ — không thêm story) | `size`/`block` — backlog nhỏ |
| Skeleton | variant×5, count, active, compose | variant×5 + count + classNames slots | — | — |
| Statistic | precision, separator, loading, countdown | title/value/prefix/suffix/valueStyle | — | `precision`/`separator` (cần quyết format locale) · countdown — component riêng |
| Table | fixed header, summary, frozen cols, virtual, expandable, selection | fixed header ✓ (scrollHeight + sticky — story 7 + test có sẵn), frozen ✓, virtual ✓, filter/sort/pagination ✓ | — KHÔNG ĐỤNG index/types (worker khác đang WIP `expandable`) | **`summary` row** — cần API mới, bị chặn tranh chấp file; làm ngay sau khi expandable merge |
| Tabs | type card, position, closable, disabled tab | items, activeKey, classNames slots | — KHÔNG ĐỤNG stories (session khác giữ) | disabled tab + type card + closable — backlog |
| Tag | color preset, closable, Checkable, icon | closable, Checkable, icon ✓ | — | color preset mở rộng — cần quyết design tokens |
| Timeline | mode left/right/alternate, pending, reverse, label | items color/label (label dưới content) | **`mode`** ×3 (label column, alternate parity antd) + **`pending`** (hollow dot) — 5 tests + 2 stories EN | `reverse` — nhỏ, đợt sau |
| Tree | showLine, checkable, draggable, selectedKeys | data/expand/click | **`showLine`** connector borders (API + 2 tests + 1 story EN) | checkable + draggable + selectedKeys — backlog lớn (ghi rõ trong comment file) |

## File tranh chấp — tôn trọng trong đợt này

- `list/index.tsx` — S (virtual WIP) · `image/image.stories.tsx` — W8 (ảnh thật) · `select.stories.tsx` — L
- `table/index.tsx` + `table/types.tsx` — worker khác đang thêm `expandable` (phát hiện qua git status, không có trong cảnh báo ban đầu)
- `segmented/skeleton/tabs.stories.tsx` — M bởi session khác → chỉ bổ API + test, không đụng stories

## Verify (paste)

```
 Test Files  23 passed (23)
      Tests  240 passed (240)
   Duration  4.82s
   (vitest run: badge card timeline tree avatar avatar-group collapse divider
    descriptions segmented table statistic tag tabs skeleton empty-state
    carousel galleria list image)

npx eslint <cụm>  → 0 errors
npx tsc --noEmit  → 0 lỗi ở mọi file đợt này
  (còn 6 lỗi TS ở src/KitchenSink.stories.tsx — file untracked tạo 16:51 bởi
   session khác: thiếu import Paragraph/Slider, onChange setState — không thuộc đợt)
```
