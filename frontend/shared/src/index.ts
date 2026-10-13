// fe-shared — barrel export
export { ApiClient, ApiError, type ApiClientOptions } from './api-client.js';
export { decodeErrorEnvelope, type ErrorEnvelope } from './error-envelope.js';
export { tokenStorage, readClaims, isExpired, type TokenStorage } from './token-storage.js';
export {
  loadRemoteModule,
  resolveRemoteUrl,
  REMOTE_NAMES,
  type RemoteName,
  type RemoteEntry,
} from './mf-bootstrap.js';
// Design-system primitives (SF-1, story VU-53) — CSS đi kèm: styles/base.css section
// Primitives (bp-*). Import styles qua subpath '@boilerplate/fe-shared/styles/*.css'.
export {
  Badge,
  EmptyState,
  Skeleton,
  Spinner,
  type BadgeVariant,
  type BadgeProps,
  type EmptyStateProps,
  type SkeletonProps,
  type SpinnerProps,
} from './ui/index.js';
