// Error envelope types — mirror của platform/conventions/04-error-envelope.md
// và components.schemas.Error trong contracts/openapi/*.yaml.

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId: string | null;
    details: unknown;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details: unknown;

  constructor(status: number, envelope: ErrorEnvelope) {
    super(envelope.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope.error.code;
    this.requestId = envelope.error.requestId;
    this.details = envelope.error.details;
  }
}

/** Parse response body 4xx/5xx thành ApiError. Body không phải envelope → envelope tổng quát. */
export function decodeErrorEnvelope(status: number, rawBody: unknown): ApiError {
  const candidate = rawBody as Partial<ErrorEnvelope> | null;
  if (candidate && typeof candidate === 'object' && candidate.error && typeof candidate.error.code === 'string') {
    return new ApiError(status, candidate as ErrorEnvelope);
  }
  return new ApiError(status, {
    error: { code: 'INTERNAL', message: `Unexpected error (HTTP ${status})`, requestId: null, details: rawBody },
  });
}
