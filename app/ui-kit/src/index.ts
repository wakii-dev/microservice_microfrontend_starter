// ui-kit — barrel export design-system primitives (tách khỏi fe-shared, ADR-0009).
// CSS đi kèm: tokens + base qua subpath '@wakii/ui-kit/styles/*.css' — base.css chứa
// section Primitives (bp-*) mà các component dưới đây consume qua class.
export {
  Badge,
  type BadgeVariant,
  type BadgeProps,
} from './ui/Badge.js';
export { EmptyState, type EmptyStateProps } from './ui/EmptyState.js';
export { Skeleton, type SkeletonProps } from './ui/Skeleton.js';
export { Spinner, type SpinnerProps } from './ui/Spinner.js';
