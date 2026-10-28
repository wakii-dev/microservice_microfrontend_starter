// ui-kit — barrel export design-system primitives (tách khỏi fe-shared, ADR-0009).
// CSS đi kèm: tokens + base qua subpath '@wakii/ui-kit/styles/*.css'; Tailwind v4
// utilities qua '@wakii/ui-kit/styles/tailwind.css' (app import 1 lần).
export { Accordion, type AccordionProps, type AccordionItem , type AccordionClassNames } from './ui/accordion/index.js';
export {
  Badge,
  type BadgeVariant,
  type BadgeProps,
  type BadgeClassNames,
} from './ui/badge/index.js';
export { EmptyState, type EmptyStateProps, type EmptyStateClassNames } from './ui/empty-state/index.js';
export { Skeleton, type SkeletonProps , type SkeletonClassNames } from './ui/skeleton/index.js';
export { Spinner, type SpinnerProps, type SpinnerClassNames } from './ui/spinner/index.js';
export { Button, type ButtonProps, type ButtonType, type ButtonClassNames } from './ui/button/index.js';
export { ButtonGroup, type ButtonGroupProps } from './ui/button/group.js';
export { Input, Textarea, type InputProps, type InputClassNames, type TextareaProps, type TextareaClassNames, type AutoSize } from './ui/input/index.js';
export { Tag, type TagProps, type TagClassNames, type CheckableTagProps, type CheckableTagClassNames } from './ui/tag/index.js';
export { Alert, type AlertProps, type AlertType , type AlertClassNames } from './ui/alert/index.js';
export { Anchor, type AnchorProps, type AnchorLinkItem, type AnchorGetContainer , type AnchorClassNames } from './ui/anchor/index.js';
export { Modal, type ModalProps , type ModalClassNames } from './ui/modal/index.js';
export { message, type MessageType , type MessageClassNames } from './ui/message/index.js';
export { UiKitProvider, type UiKitProviderProps, type ThemeTokens, type ThemeModes } from './provider/index.js';
export { Typography, Title, Text, Paragraph, type TitleProps, type TextProps, type ParagraphProps, type TextType , type TitleClassNames , type TextClassNames , type ParagraphClassNames } from './ui/typography/index.js';
export { Divider, type DividerProps , type DividerClassNames } from './ui/divider/index.js';
export { Flex, type FlexProps, type FlexGap , type FlexClassNames } from './ui/flex/index.js';
export { Layout, useSiderCollapsed, type LayoutProps, type LayoutHeaderProps, type LayoutContentProps, type LayoutFooterProps, type LayoutSiderProps, type LayoutComponent , type LayoutClassNames , type LayoutHeaderClassNames , type LayoutContentClassNames , type LayoutFooterClassNames , type LayoutSiderClassNames } from './ui/layout/index.js';
export { Row, Col, type RowProps, type ColProps , type RowClassNames , type ColClassNames } from './ui/grid/index.js';
export { Space, type SpaceProps , type SpaceClassNames } from './ui/space/index.js';
export { Card, type CardProps, type CardClassNames } from './ui/card/index.js';
export { Statistic, type StatisticProps, type StatisticClassNames } from './ui/statistic/index.js';
export { Tooltip, type TooltipProps, type TooltipClassNames } from './ui/tooltip/index.js';
export { Select, type SelectProps, type SelectClassNames, type SelectOption } from './ui/select/index.js';
export { Popconfirm, type PopconfirmProps , type PopconfirmClassNames } from './ui/popconfirm/index.js';
export { Popover, type PopoverProps, type PopoverClassNames, type PopoverPlacement, type PopoverTriggerAction } from './ui/popover/index.js';
export { Portal, type PortalProps } from './ui/portal/index.js';
export { Pagination, pageList, type PaginationProps , type PaginationClassNames } from './ui/pagination/index.js';
export { Checkbox, type CheckboxProps, type CheckboxClassNames } from './ui/checkbox/index.js';
export { Radio, RadioGroup, type RadioProps, type RadioGroupClassNames , type RadioClassNames } from './ui/radio/index.js';
export { Switch, type SwitchProps, type SwitchClassNames } from './ui/switch/index.js';
export { InputNumber, type InputNumberProps , type InputNumberClassNames } from './ui/input-number/index.js';
export { Tabs, type TabsProps, type TabItem , type TabsClassNames } from './ui/tabs/index.js';
export { Dropdown, type DropdownProps, type DropdownItem , type DropdownClassNames } from './ui/dropdown/index.js';
export { Segmented, type SegmentedProps , type SegmentedClassNames } from './ui/segmented/index.js';
export { Avatar, type AvatarProps , type AvatarClassNames } from './ui/avatar/index.js';
export { notification, type NotificationType , type NotificationClassNames } from './ui/notification/index.js';
export { Drawer, type DrawerProps , type DrawerClassNames } from './ui/drawer/index.js';
export { Progress, type ProgressProps, type ProgressClassNames } from './ui/progress/index.js';
export { Result, type ResultProps, type ResultStatus , type ResultClassNames } from './ui/result/index.js';
export { Descriptions, type DescriptionsProps, type DescriptionsClassNames, type DescriptionsItem } from './ui/descriptions/index.js';
export { Collapse, type CollapseProps, type CollapseItem , type CollapseClassNames } from './ui/collapse/index.js';
export { UiImage, type ImageProps , type UiImageClassNames } from './ui/image/index.js';
export { Table, type TableProps, type TableColumn } from './ui/table/index.js';
export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem , type BreadcrumbClassNames } from './ui/breadcrumb/index.js';
export { Steps, type StepsProps, type StepsClassNames, type StepItem } from './ui/steps/index.js';
export { BusyBox, type BusyBoxProps , type BusyBoxClassNames } from './ui/busy-box/index.js';
export { Calendar, type CalendarProps , type CalendarClassNames } from './ui/calendar/index.js';
export { DatePicker, type DatePickerProps , type DatePickerClassNames } from './ui/date-picker/index.js';
export { Slider, type SliderProps , type SliderClassNames } from './ui/slider/index.js';
export { Timeline, type TimelineProps, type TimelineClassNames, type TimelineItem } from './ui/timeline/index.js';
export { Rating, type RatingProps , type RatingClassNames } from './ui/rating/index.js';
export { Toolbar, type ToolbarProps , type ToolbarClassNames } from './ui/toolbar/index.js';
export { ScrollTop, type ScrollTopProps , type ScrollTopClassNames } from './ui/scrolltop/index.js';
export { BlockUI, type BlockUIProps , type BlockUIClassNames } from './ui/blockui/index.js';
export { ToggleButton, type ToggleButtonProps , type ToggleButtonClassNames } from './ui/toggle-button/index.js';
export { Password, type PasswordProps , type PasswordClassNames } from './ui/password/index.js';
export { InputOTP, type InputOTPProps , type InputOTPClassNames } from './ui/input-otp/index.js';
export { InputMask, type InputMaskProps , type InputMaskClassNames } from './ui/input-mask/index.js';
export { Listbox, type ListboxProps, type ListboxOption , type ListboxClassNames } from './ui/listbox/index.js';
// 0.5.0 BREAKING: Carousel rời barrel chính (nh phụ thuộc swiper/react — phá
// nguyên tắc 0-deps của barrel, consumer không cài swiper fail vite build).
// Import qua subpath: `import { Carousel } from '@wakii/ui-kit/carousel'`.
export { ColorPicker, type ColorPickerProps , type ColorPickerClassNames } from './ui/color-picker/index.js';
export { SpeedDial, type SpeedDialProps, type SpeedDialAction , type SpeedDialClassNames } from './ui/speed-dial/index.js';
export { Galleria, type GalleriaProps, type GalleriaImage , type GalleriaClassNames } from './ui/galleria/index.js';
export { Tree, type TreeProps, type TreeNodeData , type TreeClassNames } from './ui/tree/index.js';
export { TreeTable, type TreeTableProps, type TreeTableNode, type TreeTableColumn , type TreeTableClassNames } from './ui/tree-table/index.js';
export { Splitter, type SplitterProps , type SplitterClassNames } from './ui/splitter/index.js';
// 0.6.0 BREAKING: Chart/Schedule/Editor rời barrel chính (theo Carousel 0.5.0).
// Lý do: dist npm dùng dynamic import specifier LITERAL cho peer (chart.js/
// @fullcalendar/*) — component phải tách subpath để barrel giữ nguyên tắc 0-deps,
// còn specifier literal chỉ resolve được khi consumer cài peer (khai báo đủ ở
// package.json — build error RÕ thay vì fallback câm lặng, BUG #4).
// Import component qua subpath: `@wakii/ui-kit/chart|schedule|editor`.
// Types GIỮ ở barrel (export type — bị xoá lúc build, không kéo runtime peer vào graph).
export type { ChartProps, ChartConfig, ChartDataset,
  ChartClassNames } from './ui/chart/index.js';
export type { ScheduleProps, ScheduleEvent,
  ScheduleClassNames } from './ui/schedule/index.js';
export type { EditorProps,
  EditorClassNames } from './ui/editor/index.js';
export { Watermark, type WatermarkProps, type WatermarkFont , type WatermarkClassNames } from './ui/watermark/index.js';

export { ContextMenu, type ContextMenuProps , type ContextMenuClassNames } from './ui/context-menu/index.js';
export { Menubar, type MenubarProps, type MenubarItem , type MenubarClassNames } from './ui/menubar/index.js';
export { PanelMenu, type PanelMenuProps, type PanelMenuItem , type PanelMenuClassNames } from './ui/panel-menu/index.js';
export { TabMenu, type TabMenuProps, type TabMenuItem , type TabMenuClassNames } from './ui/tab-menu/index.js';
export { SplitButton, type SplitButtonProps, type SplitButtonItem , type SplitButtonClassNames } from './ui/split-button/index.js';

// ── Hooks (native, spec usehooks.com — batch ④ 2026-10-17) ──
export { useLocalStorage } from './hooks/useLocalStorage.js';
export { useSessionStorage } from './hooks/useSessionStorage.js';
export { useToggle } from './hooks/useToggle.js';
export { usePrevious } from './hooks/usePrevious.js';
export { useDefault } from './hooks/useDefault.js';
export { useDebounce } from './hooks/useDebounce.js';
export { useThrottle } from './hooks/useThrottle.js';
export { useTimeout } from './hooks/useTimeout.js';
export { useCountdown } from './hooks/useCountdown.js';
export { useClickAway } from './hooks/useClickAway.js';
export { useHover } from './hooks/useHover.js';
export { useKeyPress } from './hooks/useKeyPress.js';
export { useMediaQuery } from './hooks/useMediaQuery.js';
export { useLockBodyScroll } from './hooks/useLockBodyScroll.js';
export { useWindowSize } from './hooks/useWindowSize.js';
export { useCopyToClipboard } from './hooks/useCopyToClipboard.js';

// ── Hooks wave ×12 (PO 1.0.0 — lifecycle/observers/controllable) ──
// 2026-10-24: hooks wave hoàn thiện (worker-tokens M#6+M#7, 35 file mới +
// 135 tests) — mở lại toàn bộ export đã comment từ fix barrel 2032bc1.
export { useMountEffect } from './hooks/useMountEffect.js';
export { useUpdateEffect } from './hooks/useUpdateEffect.js';
export { useIsFirstRender } from './hooks/useIsFirstRender.js';
export { useControllableState, type UseControllableStateOptions } from './hooks/useControllableState.js';
export { useEventListener, type EventListenerTarget } from './hooks/useEventListener.js';
export { useScrollProgress } from './hooks/useScrollProgress.js';
export { useInView, type UseInViewOptions, type UseInViewReturn } from './hooks/useInView.js';
export { useInfiniteScroll, type UseInfiniteScrollOptions } from './hooks/useInfiniteScroll.js';
export { useMeasure, type ElementSize } from './hooks/useMeasure.js';
export { useOnlineStatus } from './hooks/useOnlineStatus.js';
export { useFullscreen, type UseFullscreenReturn } from './hooks/useFullscreen.js';
export { useTitle } from './hooks/useTitle.js';

// ── Theming (theming 2, 2026-10-27): palette chart public theo scope theme ──
export { useChartPalette, type ChartPalette, type UseChartPaletteReturn } from './hooks/useChartPalette.js';

// ── Navigation mới (batch ② 2026-10-17) ──
export { Menu, type MenuProps, type MenuItemData, MenuCompactContext, findPath } from './ui/menu/index.js';
export { Sidebar, type SidebarProps , type SidebarClassNames } from './ui/sidebar/index.js';
export { useForm, type UseFormOptions, type FormErrors, type FormValidationMode } from './hooks/useForm.js';

// ── Upload (batch ③ 2026-10-18) ──
export { Upload, UploadDropzone } from './ui/upload/index.js';
export type { UploadItem, UploadProps, UploadStatus } from './ui/upload/upload-core.js';

// ── Icon system + Field (batch ⑥⑩ 2026-10-18) ──
export { Icon, type IconName , type IconClassNames } from './ui/icons/index.js';
export { Field, type FieldProps , type FieldClassNames } from './ui/field/index.js';

// ── Data display mới (batch ⑨ 2026-10-18) ──
export { List, type ListProps, type ListClassNames } from './ui/list/index.js';
export { AvatarGroup, type AvatarGroupProps , type AvatarGroupClassNames } from './ui/avatar-group/index.js';
export { TreeSelect, type TreeSelectProps, type TreeNode , type TreeSelectClassNames } from './ui/tree-select/index.js';

// ── Date/Time (batch ⑧ 2026-10-18) ──
export { TimePicker, type TimePickerProps , type TimePickerClassNames } from './ui/time-picker/index.js';
export { Timesheet, type TimesheetProps, type TimesheetRow, type TimesheetClassNames } from './ui/timesheet/index.js';
export type { DateLocale } from './ui/date-picker/locale.js';
export { useFocusTrap } from './hooks/useFocusTrap.js';

// ── Misc family (batch 3) — bổ sung barrel sau QA sweep 2026-10-18 (comp có test
// nhưng thiếu export, stories = backlog riêng) ──
export { AutoComplete, type AutoCompleteProps , type AutoCompleteClassNames } from './ui/auto-complete/index.js';
export { CascadeSelect, type CascadeSelectProps , type CascadeSelectClassNames } from './ui/cascade-select/index.js';
export { Chips, type ChipsProps , type ChipsClassNames } from './ui/chips/index.js';
export { Inplace, type InplaceProps , type InplaceClassNames } from './ui/inplace/index.js';
export { Knob, type KnobProps , type KnobClassNames } from './ui/knob/index.js';
export { Mention, type MentionProps , type MentionClassNames } from './ui/mention/index.js';
export { OrderList, type OrderListProps, type OrderListItem , type OrderListClassNames } from './ui/order-list/index.js';
export { PickList, type PickListProps , type PickListClassNames } from './ui/pick-list/index.js';
export { ScrollPanel, type ScrollPanelProps , type ScrollPanelClassNames } from './ui/scroll-panel/index.js';
// 2026-10-24: scroll-page hoàn thiện (M#6) — mở lại export.
export { ScrollPage, type ScrollPageProps, type ScrollPageSectionProps, type ScrollPageComponent , type ScrollPageClassNames , type ScrollPageSectionClassNames } from './ui/scroll-page/index.js';

// ── Utils (batch utils wave 2026-10-18) — format / array-cây / dom helpers ──
// 2026-10-24: utils hoàn thiện (M#6) — mở lại export.
export { formatCurrency, formatBytes, formatRelativeTime, formatNumber } from './utils/format.js';
export { chunk, groupBy, flattenTree, findTreeNode, type FlatTreeNode } from './utils/array.js';
export { getScrollParent, getFocusableElements, cx } from './utils/dom.js';
export { VirtualScroll, type VirtualScrollProps , type VirtualScrollClassNames } from './ui/virtual-scroll/index.js';

// ── Gap P0 parity (worker W6 2026-10-18): Input.Search · Link · Affix · Table expandable ──
export { Link, type LinkProps, type LinkUnderline , type LinkClassNames } from './ui/link/index.js';
export { Affix, type AffixProps , type AffixClassNames } from './ui/affix/index.js';
export type { InputSearchProps } from './ui/input/input-search.js';
export type { TableExpandableConfig } from './ui/table/types.js';

// ── Gap P1 parity (worker W8 2026-10-18): Tour · ToggleButtonGroup ──
export { ToggleButtonGroup, type ToggleButtonGroupProps } from './ui/toggle-button/toggle-button-group.js';
export { Tour, type TourProps, type TourStep , type TourClassNames } from './ui/tour/index.js';
export { QRCode, type QRCodeProps , type QRCodeClassNames } from './ui/qr-code/index.js';
export type { QrErrorLevel, QrMatrix } from './ui/qr-code/qrcode-core.js';

// ── Drag & Drop + Kanban (worker W9 2026-10-18) — native HTML5 DnD, 0 deps ──
export { DRAG_MIME, DragDropProvider, Draggable, DropZone, type DragDropApi, type DraggableProps, type DropZoneProps , type DraggableClassNames , type DropZoneClassNames } from './ui/drag-drop/index.js';
export { KanbanBoard, type KanbanBoardProps, type KanbanCardData, type KanbanColumnData , type KanbanBoardClassNames } from './ui/kanban/index.js';

// ── Motion effects (worker W8 2026-10-18) — scroll/reveal/count, 0 deps ──
export { CountUp, type CountUpProps , type CountUpClassNames } from './ui/count-up/index.js';
export { Parallax, type ParallaxProps , type ParallaxClassNames } from './ui/parallax/index.js';
export { Reveal, type RevealDirection, type RevealProps , type RevealClassNames } from './ui/reveal/index.js';

// ── useForm companion (worker W6 2026-10-18): Form.List parity ──
export { useFieldArray, type FieldArrayHelpers } from './hooks/useFieldArray.js';
export type { FormInstance } from './hooks/useForm.js';

// ── Nav family (worker W9 2026-10-18): MegaMenu + SlideMenu — 0 deps ──
export { MegaMenu, type MegaMenuGroup, type MegaMenuItem, type MegaMenuLeaf, type MegaMenuProps , type MegaMenuClassNames } from './ui/mega-menu/index.js';
export { SlideMenu, type SlideMenuItem, type SlideMenuProps , type SlideMenuClassNames } from './ui/slide-menu/index.js';

// ── Motion effects bổ sung (worker W8 2026-10-18): Transition + Backdrop — 0 deps ──
export { Backdrop, type BackdropProps , type BackdropClassNames } from './ui/backdrop/index.js';
// Collapse của transition đổi tên barrel thành CollapseTransition — trùng tên với
// Collapse (ui/collapse) ở trên (precedent UiImage)
export { Collapse as CollapseTransition, Fade, Zoom, type TransitionProps , type TransitionClassNames } from './ui/transition/index.js';

// ── Mobile/utility (worker V1 2026-10-18): BottomNavigation · DeferredContent · Fieldset · FloatButton — 0 deps ──
export { BottomNavigation, type BottomNavigationProps, type BottomNavItem , type BottomNavigationClassNames } from './ui/bottom-navigation/index.js';
export { DeferredContent, type DeferredContentProps , type DeferredContentClassNames } from './ui/deferred-content/index.js';
export { Fieldset, type FieldsetProps , type FieldsetClassNames } from './ui/fieldset/index.js';
export {
  FloatButton,
  FloatButtonGroup,
  FloatButtonBackTop,
  type FloatButtonProps,
  type FloatButtonGroupProps,
  type FloatButtonBackTopProps,
  type FloatButtonClassNames,
  type FloatButtonGroupClassNames,
  type FloatButtonBackTopClassNames,
} from './ui/float-button/index.js';

// ── Team-OS domain (worker V1 2026-10-19): PingFeed · StagePipeline · DebtBoard · TeamDashboard · InboxThread ──
export { PingFeed, relTime, type PingFeedProps, type PingEvent, type PingKind } from './ui/team/ping-feed/index.js';
export { StagePipeline, type StagePipelineProps, type PipelineStage, type StageState } from './ui/team/stage-pipeline/index.js';
export { DebtBoard, type DebtBoardProps, type DebtItem, type DebtStatus } from './ui/team/debt-board/index.js';
export { TeamDashboard, type TeamDashboardProps, type TeamStats } from './ui/team/team-dashboard/index.js';
export { InboxThread, type InboxThreadProps, type ThreadMessage } from './ui/team/inbox-thread/index.js';
