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
