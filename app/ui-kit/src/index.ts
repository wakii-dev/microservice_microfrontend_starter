// ui-kit — barrel export design-system primitives (tách khỏi fe-shared, ADR-0009).
// CSS đi kèm: tokens + base qua subpath '@wakii/ui-kit/styles/*.css'; Tailwind v4
// utilities qua '@wakii/ui-kit/styles/tailwind.css' (app import 1 lần).
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
export { Modal, type ModalProps } from './ui/modal/index.js';
export { message, type MessageType } from './ui/message/index.js';
export { UiKitProvider, type UiKitProviderProps } from './provider/index.js';
export { Typography, Title, Text, Paragraph, type TitleProps, type TextProps, type ParagraphProps, type TextType } from './ui/typography/index.js';
export { Divider, type DividerProps } from './ui/divider/index.js';
export { Space, type SpaceProps } from './ui/space/index.js';
export { Card, type CardProps } from './ui/card/index.js';
export { Statistic, type StatisticProps } from './ui/statistic/index.js';
export { Tooltip, type TooltipProps } from './ui/tooltip/index.js';
export { Select, type SelectProps, type SelectOption } from './ui/select/index.js';
export { Popconfirm, type PopconfirmProps } from './ui/popconfirm/index.js';
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
export { Splitter, type SplitterProps } from './ui/splitter/index.js';
export { Chart, type ChartProps, type ChartConfig, type ChartDataset } from './ui/chart/index.js';
export { Schedule, type ScheduleProps, type ScheduleEvent } from './ui/schedule/index.js';
export { Editor, type EditorProps } from './ui/editor/index.js';

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

// ── Navigation mới (batch ② 2026-10-17) ──
export { Menu, type MenuProps, type MenuItemData, MenuCompactContext } from './ui/menu/index.js';
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
export type { DateLocale } from './ui/date-picker/locale.js';
export { useFocusTrap } from './hooks/useFocusTrap.js';
