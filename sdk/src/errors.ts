/**
 * Error types raised by the HoodCompute SDK.
 *
 * Every failed API request is surfaced as a `HoodComputeError` (or a subclass).
 * The machine-readable `code` maps to the codes documented at
 * https://docs.hoodcompute.com/api-reference/errors.
 */

/** Shape of the error body returned by the API. */
export interface ApiErrorBody {
  code?: string
  message?: string
  type?: string
  param?: string | null
  docs?: string
  details?: Record<string, unknown>
}

/** Base class for all errors raised by the SDK. */
export class HoodComputeError extends Error {
  /** HTTP status code, when the error came from an API response. */
  readonly status?: number
  /** Machine-readable error code, for example `insufficient_credits`. */
  readonly code?: string
  /** Error category reported by the API. */
  readonly type?: string
  /** Request parameter that caused the error, when applicable. */
  readonly param?: string | null
  /** Additional structured detail from the API. */
  readonly details?: Record<string, unknown>
  /** Value of the `x-request-id` response header, useful for support. */
  readonly requestId?: string

  constructor(
    message: string,
    opts: {
      status?: number
      code?: string
      type?: string
      param?: string | null
      details?: Record<string, unknown>
      requestId?: string
    } = {},
  ) {
    super(message)
    this.name = "HoodComputeError"
    this.status = opts.status
    this.code = opts.code
    this.type = opts.type
    this.param = opts.param
    this.details = opts.details
    this.requestId = opts.requestId
  }
}

/** 401 / 403. The API key is missing, invalid, revoked, or suspended. */
export class AuthenticationError extends HoodComputeError {
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "AuthenticationError"
  }
}

/** 402. The credit balance is too low for the requested tier. */
export class InsufficientCreditsError extends HoodComputeError {
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "InsufficientCreditsError"
  }
}

/** 400. The request body is malformed or a required field is missing. */
export class InvalidRequestError extends HoodComputeError {
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "InvalidRequestError"
  }
}

/** 404. The requested resource does not exist. */
export class NotFoundError extends HoodComputeError {
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "NotFoundError"
  }
}

/** 429. The request rate to the API is too high. Back off and retry. */
export class RateLimitError extends HoodComputeError {
  /** Suggested seconds to wait before retrying, when the API provides one. */
  get retryAfter(): number | undefined {
    const value = this.details?.retry_after
    return typeof value === "number" ? value : undefined
  }
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "RateLimitError"
  }
}

/**
 * 503. No workers are currently hosting the requested model. This is a
 * transient condition. Check `retryAfter` and try again.
 */
export class NoWorkersAvailableError extends HoodComputeError {
  /** Suggested seconds to wait before retrying. */
  get retryAfter(): number | undefined {
    const value = this.details?.retry_after
    return typeof value === "number" ? value : undefined
  }
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "NoWorkersAvailableError"
  }
}

/** 504. No worker completed the job within the timeout. Credits were refunded. */
export class JobTimeoutError extends HoodComputeError {
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "JobTimeoutError"
  }
}

/** 5xx. An internal server error. Usually safe to retry. */
export class ServerError extends HoodComputeError {
  constructor(...args: ConstructorParameters<typeof HoodComputeError>) {
    super(...args)
    this.name = "ServerError"
  }
}

/** The request failed to reach the API, or timed out, or was aborted. */
export class ConnectionError extends HoodComputeError {
  constructor(message: string, opts: { cause?: unknown } = {}) {
    super(message)
    this.name = "ConnectionError"
    if (opts.cause !== undefined) this.cause = opts.cause
  }
}

/**
 * Construct the appropriate error subclass from an API response.
 * @internal
 */
export function errorFromResponse(
  status: number,
  body: ApiErrorBody | undefined,
  requestId?: string,
): HoodComputeError {
  const code = body?.code
  const message = body?.message ?? `HoodCompute API request failed with status ${status}`
  const opts = {
    status,
    code,
    type: body?.type,
    param: body?.param ?? null,
    details: body?.details,
    requestId,
  }

  if (code === "no_workers_available") return new NoWorkersAvailableError(message, opts)
  if (code === "job_timeout") return new JobTimeoutError(message, opts)
  if (code === "insufficient_credits") return new InsufficientCreditsError(message, opts)

  switch (status) {
    case 400:
    case 422:
      return new InvalidRequestError(message, opts)
    case 401:
    case 403:
      return new AuthenticationError(message, opts)
    case 402:
      return new InsufficientCreditsError(message, opts)
    case 404:
      return new NotFoundError(message, opts)
    case 429:
      return new RateLimitError(message, opts)
    case 503:
      return new NoWorkersAvailableError(message, opts)
    case 504:
      return new JobTimeoutError(message, opts)
    default:
      if (status >= 500) return new ServerError(message, opts)
      return new HoodComputeError(message, opts)
  }
}

/** Whether an error is worth retrying with the same payload. @internal */
export function isRetryable(err: unknown): boolean {
  if (err instanceof ConnectionError) return true
  if (err instanceof HoodComputeError) {
    if (err.status === undefined) return false
    return err.status >= 500 || err.status === 429
  }
  return false
}
