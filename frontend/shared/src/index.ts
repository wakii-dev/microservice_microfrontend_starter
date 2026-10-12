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
