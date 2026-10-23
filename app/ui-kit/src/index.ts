// ui-kit — barrel export design-system primitives (tách khỏi fe-shared, ADR-0009).
// CSS đi kèm: tokens + base qua subpath '@wakii/ui-kit/styles/*.css'; Tailwind v4
// utilities qua '@wakii/ui-kit/styles/tailwind.css' (app import 1 lần).
export { Accordion, type AccordionProps, type AccordionItem } from './ui/accordion/index.js';
export {
  Badge,
  type BadgeVariant,
  type BadgeProps,
} from './ui/badge/index.js';
export { EmptyState, type EmptyStateProps } from './ui/empty-state/index.js';
export { Skeleton, type SkeletonProps } from './ui/skeleton/index.js';
export { Spinner, type SpinnerProps } from './ui/spinner/index.js';
export { Button, type ButtonProps, type ButtonType } from './ui/button/index.js';
export { Input, Textarea, type InputProps, type TextareaProps } from './ui/input/index.js';
export { Tag, type TagProps, type CheckableTagProps } from './ui/tag/index.js';
export { Alert, type AlertProps, type AlertType } from './ui/alert/index.js';
export { Anchor, type AnchorProps, type AnchorLinkItem, type AnchorGetContainer } from './ui/anchor/index.js';
export { Modal, type ModalProps } from './ui/modal/index.js';
export { message, type MessageType } from './ui/message/index.js';
export { UiKitProvider, type UiKitProviderProps } from './provider/index.js';
export { Typography, Title, Text, Paragraph, type TitleProps, type TextProps, type ParagraphProps, type TextType } from './ui/typography/index.js';
export { Divider, type DividerProps } from './ui/divider/index.js';
export { Flex, type FlexProps, type FlexGap } from './ui/flex/index.js';
export { Layout, useSiderCollapsed, type LayoutProps, type LayoutHeaderProps, type LayoutContentProps, type LayoutFooterProps, type LayoutSiderProps, type LayoutComponent } from './ui/layout/index.js';
export { Row, Col, type RowProps, type ColProps } from './ui/grid/index.js';
export { Space, type SpaceProps } from './ui/space/index.js';
export { Card, type CardProps } from './ui/card/index.js';
export { Statistic, type StatisticProps } from './ui/statistic/index.js';
export { Tooltip, type TooltipProps } from './ui/tooltip/index.js';
export { Select, type SelectProps, type SelectOption } from './ui/select/index.js';
export { Popconfirm, type PopconfirmProps } from './ui/popconfirm/index.js';
export { Popover, type PopoverProps, type PopoverPlacement, type PopoverTriggerAction } from './ui/popover/index.js';
export { Pagination, pageList, type PaginationProps } from './ui/pagination/index.js';
export { Checkbox, type CheckboxProps } from './ui/checkbox/index.js';
export { Radio, RadioGroup, type RadioProps, type RadioGroupProps } from './ui/radio/index.js';
export { Switch, type SwitchProps } from './ui/switch/index.js';
export { InputNumber, type InputNumberProps } from './ui/input-number/index.js';
export { Tabs, type TabsProps, type TabItem } from './ui/tabs/index.js';
export { Dropdown, type DropdownProps, type DropdownItem } from './ui/dropdown/index.js';
export { Segmented, type SegmentedProps } from './ui/segmented/index.js';
export { Avatar, type AvatarProps } from './ui/avatar/index.js';
export { notification, type NotificationType } from './ui/notification/index.js';
export { Drawer, type DrawerProps } from './ui/drawer/index.js';
export { Progress, type ProgressProps } from './ui/progress/index.js';
export { Result, type ResultProps, type ResultStatus } from './ui/result/index.js';
export { Descriptions, type DescriptionsProps, type DescriptionsItem } from './ui/descriptions/index.js';
export { Collapse, type CollapseProps, type CollapseItem } from './ui/collapse/index.js';
export { UiImage, type ImageProps } from './ui/image/index.js';
export { Table, type TableProps, type TableColumn } from './ui/table/index.js';
export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem } from './ui/breadcrumb/index.js';
export { Steps, type StepsProps, type StepItem } from './ui/steps/index.js';
export { BusyBox, type BusyBoxProps } from './ui/busy-box/index.js';
export { Calendar, type CalendarProps } from './ui/calendar/index.js';
export { DatePicker, type DatePickerProps } from './ui/date-picker/index.js';
export { Slider, type SliderProps } from './ui/slider/index.js';
export { Timeline, type TimelineProps, type TimelineItem } from './ui/timeline/index.js';
export { Rating, type RatingProps } from './ui/rating/index.js';
export { Toolbar, type ToolbarProps } from './ui/toolbar/index.js';
export { ScrollTop, type ScrollTopProps } from './ui/scrolltop/index.js';
export { BlockUI, type BlockUIProps } from './ui/blockui/index.js';
export { ToggleButton, type ToggleButtonProps } from './ui/toggle-button/index.js';
export { Password, type PasswordProps } from './ui/password/index.js';
export { InputOTP, type InputOTPProps } from './ui/input-otp/index.js';
export { InputMask, type InputMaskProps } from './ui/input-mask/index.js';
export { Listbox, type ListboxProps, type ListboxOption } from './ui/listbox/index.js';
export { Carousel, type CarouselProps } from './ui/carousel/index.js';
export { ColorPicker, type ColorPickerProps } from './ui/color-picker/index.js';
export { SpeedDial, type SpeedDialProps, type SpeedDialAction } from './ui/speed-dial/index.js';
export { Galleria, type GalleriaProps, type GalleriaImage } from './ui/galleria/index.js';
export { Tree, type TreeProps, type TreeNodeData } from './ui/tree/index.js';
export { TreeTable, type TreeTableProps, type TreeTableNode, type TreeTableColumn } from './ui/tree-table/index.js';
export { Splitter, type SplitterProps } from './ui/splitter/index.js';
export { Chart, useChartTheme, type ChartProps, type ChartConfig, type ChartDataset } from './ui/chart/index.js';
export { Schedule, type ScheduleProps, type ScheduleEvent } from './ui/schedule/index.js';
export { Editor, type EditorProps } from './ui/editor/index.js';
export { Watermark, type WatermarkProps, type WatermarkFont } from './ui/watermark/index.js';

export { ContextMenu, type ContextMenuProps } from './ui/context-menu/index.js';
export { Menubar, type MenubarProps, type MenubarItem } from './ui/menubar/index.js';
export { PanelMenu, type PanelMenuProps, type PanelMenuItem } from './ui/panel-menu/index.js';
export { TabMenu, type TabMenuProps, type TabMenuItem } from './ui/tab-menu/index.js';
export { SplitButton, type SplitButtonProps, type SplitButtonItem } from './ui/split-button/index.js';

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
// ⚠️ 2026-10-23: 12 hooks + 3 utils modules dưới đây CHƯA có file nguồn được
// commit (barrel 2032bc1 thêm export nhưng thiếu file → TS2307/collect-fail
// toàn consumers). Tạm bỏ export — hooks sẽ hoàn thiện + export lại ở PR riêng.
// export { useMountEffect } from './hooks/useMountEffect.js';
// export { useUpdateEffect } from './hooks/useUpdateEffect.js';
// export { useIsFirstRender } from './hooks/useIsFirstRender.js';
// export { useControllableState, type UseControllableStateOptions } from './hooks/useControllableState.js';
// export { useEventListener, type EventListenerTarget } from './hooks/useEventListener.js';
// export { useScrollProgress } from './hooks/useScrollProgress.js';
// export { useInView, type UseInViewOptions, type UseInViewReturn } from './hooks/useInView.js';
// export { useInfiniteScroll, type UseInfiniteScrollOptions } from './hooks/useInfiniteScroll.js';
// export { useMeasure, type ElementSize } from './hooks/useMeasure.js';
// export { useOnlineStatus } from './hooks/useOnlineStatus.js';
// export { useFullscreen, type UseFullscreenReturn } from './hooks/useFullscreen.js';
// export { useTitle } from './hooks/useTitle.js';

// ── Navigation mới (batch ② 2026-10-17) ──
export { Menu, type MenuProps, type MenuItemData, MenuCompactContext, findPath } from './ui/menu/index.js';
export { Sidebar, type SidebarProps } from './ui/sidebar/index.js';
export { useForm, type UseFormOptions, type FormErrors, type FormValidationMode } from './hooks/useForm.js';

// ── Upload (batch ③ 2026-10-18) ──
export { Upload, UploadDropzone } from './ui/upload/index.js';
export type { UploadItem, UploadProps, UploadStatus } from './ui/upload/upload-core.js';

// ── Icon system + Field (batch ⑥⑩ 2026-10-18) ──
export { Icon, type IconName } from './ui/icons/index.js';
export { Field, type FieldProps } from './ui/field/index.js';

// ── Data display mới (batch ⑨ 2026-10-18) ──
export { List, type ListProps } from './ui/list/index.js';
export { AvatarGroup, type AvatarGroupProps } from './ui/avatar-group/index.js';
export { TreeSelect, type TreeSelectProps, type TreeNode } from './ui/tree-select/index.js';

// ── Date/Time (batch ⑧ 2026-10-18) ──
export { TimePicker, type TimePickerProps } from './ui/time-picker/index.js';
export { Timesheet, type TimesheetProps, type TimesheetRow, type TimesheetClassNames } from './ui/timesheet/index.js';
export type { DateLocale } from './ui/date-picker/locale.js';
export { useFocusTrap } from './hooks/useFocusTrap.js';

// ── Misc family (batch 3) — bổ sung barrel sau QA sweep 2026-10-18 (comp có test
// nhưng thiếu export, stories = backlog riêng) ──
export { AutoComplete, type AutoCompleteProps } from './ui/auto-complete/index.js';
export { CascadeSelect, type CascadeSelectProps } from './ui/cascade-select/index.js';
export { Chips, type ChipsProps } from './ui/chips/index.js';
export { Inplace, type InplaceProps } from './ui/inplace/index.js';
export { Knob, type KnobProps } from './ui/knob/index.js';
export { Mention, type MentionProps } from './ui/mention/index.js';
export { OrderList, type OrderListProps, type OrderListItem } from './ui/order-list/index.js';
export { PickList, type PickListProps } from './ui/pick-list/index.js';
export { ScrollPanel, type ScrollPanelProps } from './ui/scroll-panel/index.js';
// ⚠️ 2026-10-23: src/ui/scroll-page/ chưa được commit (cùng lỗi barrel 2032bc1) — bỏ tạm.
// export { ScrollPage, type ScrollPageProps, type ScrollPageSectionProps, type ScrollPageComponent } from './ui/scroll-page/index.js';

// ── Utils (batch utils wave 2026-10-18) — format / array-cây / dom helpers ──
// ⚠️ 2026-10-23: src/utils/ chưa được commit (cùng lỗi barrel 2032bc1) — bỏ tạm.
// export { formatCurrency, formatBytes, formatRelativeTime, formatNumber } from './utils/format.js';
// export { chunk, groupBy, flattenTree, findTreeNode, type FlatTreeNode } from './utils/array.js';
// export { getScrollParent, getFocusableElements, cx } from './utils/dom.js';
export { VirtualScroll, type VirtualScrollProps } from './ui/virtual-scroll/index.js';

// ── Gap P0 parity (worker W6 2026-10-18): Input.Search · Link · Affix · Table expandable ──
export { Link, type LinkProps, type LinkUnderline } from './ui/link/index.js';
export { Affix, type AffixProps } from './ui/affix/index.js';
export type { InputSearchProps } from './ui/input/input-search.js';
export type { TableExpandableConfig } from './ui/table/types.js';

// ── Gap P1 parity (worker W8 2026-10-18): Tour · ToggleButtonGroup ──
export { ToggleButtonGroup, type ToggleButtonGroupProps } from './ui/toggle-button/toggle-button-group.js';
export { Tour, type TourProps, type TourStep } from './ui/tour/index.js';
export { QRCode, type QRCodeProps } from './ui/qr-code/index.js';
export type { QrErrorLevel, QrMatrix } from './ui/qr-code/qrcode-core.js';

// ── Drag & Drop + Kanban (worker W9 2026-10-18) — native HTML5 DnD, 0 deps ──
export { DRAG_MIME, DragDropProvider, Draggable, DropZone, type DragDropApi, type DraggableProps, type DropZoneProps } from './ui/drag-drop/index.js';
export { KanbanBoard, type KanbanBoardProps, type KanbanCardData, type KanbanColumnData } from './ui/kanban/index.js';

// ── Motion effects (worker W8 2026-10-18) — scroll/reveal/count, 0 deps ──
export { CountUp, type CountUpProps } from './ui/count-up/index.js';
export { Parallax, type ParallaxProps } from './ui/parallax/index.js';
export { Reveal, type RevealDirection, type RevealProps } from './ui/reveal/index.js';

// ── useForm companion (worker W6 2026-10-18): Form.List parity ──
export { useFieldArray, type FieldArrayHelpers } from './hooks/useFieldArray.js';
export type { FormInstance } from './hooks/useForm.js';

// ── Nav family (worker W9 2026-10-18): MegaMenu + SlideMenu — 0 deps ──
export { MegaMenu, type MegaMenuGroup, type MegaMenuItem, type MegaMenuLeaf, type MegaMenuProps } from './ui/mega-menu/index.js';
export { SlideMenu, type SlideMenuItem, type SlideMenuProps } from './ui/slide-menu/index.js';

// ── Motion effects bổ sung (worker W8 2026-10-18): Transition + Backdrop — 0 deps ──
export { Backdrop, type BackdropProps } from './ui/backdrop/index.js';
// Collapse của transition đổi tên barrel thành CollapseTransition — trùng tên với
// Collapse (ui/collapse) ở trên (precedent UiImage)
export { Collapse as CollapseTransition, Fade, Zoom, type TransitionProps } from './ui/transition/index.js';

// ── Mobile/utility (worker V1 2026-10-18): BottomNavigation · DeferredContent · Fieldset · FloatButton — 0 deps ──
export { BottomNavigation, type BottomNavigationProps, type BottomNavItem } from './ui/bottom-navigation/index.js';
export { DeferredContent, type DeferredContentProps } from './ui/deferred-content/index.js';
export { Fieldset, type FieldsetProps } from './ui/fieldset/index.js';
export {
  FloatButton,
  FloatButtonGroup,
  FloatButtonBackTop,
  type FloatButtonProps,
  type FloatButtonGroupProps,
  type FloatButtonBackTopProps,
} from './ui/float-button/index.js';

// ── Team-OS domain (worker V1 2026-10-19): PingFeed · StagePipeline · DebtBoard · TeamDashboard · InboxThread ──
export { PingFeed, relTime, type PingFeedProps, type PingEvent, type PingKind } from './ui/team/ping-feed/index.js';
export { StagePipeline, type StagePipelineProps, type PipelineStage, type StageState } from './ui/team/stage-pipeline/index.js';
export { DebtBoard, type DebtBoardProps, type DebtItem, type DebtStatus } from './ui/team/debt-board/index.js';
export { TeamDashboard, type TeamDashboardProps, type TeamStats } from './ui/team/team-dashboard/index.js';
export { InboxThread, type InboxThreadProps, type ThreadMessage } from './ui/team/inbox-thread/index.js';
