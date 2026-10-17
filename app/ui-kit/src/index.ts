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
