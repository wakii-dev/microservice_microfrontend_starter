// fe-shared — barrel export (LOGIC ONLY — design system đã tách sang @wakii-dev/ui-kit,
// ADR-0009 2026-10-17: primitives + tokens/base css sống ở ui-kit, imports UI đổi thẳng)
export { ApiClient, ApiError, type ApiClientOptions } from './api-client.js';
export { decodeErrorEnvelope, type ErrorEnvelope } from './error-envelope.js';
export { tokenStorage, readClaims, isExpired, type TokenStorage } from './token-storage.js';
export {
  createAuthClient,
  REFRESH_STORAGE_KEY,
  type AuthClient,
  type AuthSession,
  type AuthUser,
  type TokenPair,
} from './refresh-client.js';
export {
  loadRemoteModule,
  resolveRemoteUrl,
  REMOTE_NAMES,
  type RemoteName,
  type RemoteEntry,
  type LoadRemoteModuleOptions,
} from './mf-bootstrap.js';
