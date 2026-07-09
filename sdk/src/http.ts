/**
 * Internal HTTP transport. Handles authentication headers, timeouts, automatic
 * retries with exponential backoff, and error normalization. Not part of the
 * public API surface.
 * @internal
 */

import {
  ConnectionError,
  errorFromResponse,
  isRetryable,
  type ApiErrorBody,
} from "./errors.js"
import { SDK_VERSION } from "./constants.js"

export interface HttpClientOptions {
  apiKey: string
  baseURL: string
  timeout: number
  maxRetries: number
  defaultHeaders?: Record<string, string>
  fetch?: typeof fetch
}

export interface RequestOptions {
  method?: string
  path: string
  query?: Record<string, string | number | undefined>
  body?: unknown
  /** When true, the raw Response is returned without reading the body. */
  stream?: boolean
  signal?: AbortSignal
}

export class HttpClient {
  private readonly apiKey: string
  private readonly baseURL: string
  private readonly timeout: number
  private readonly maxRetries: number
  private readonly defaultHeaders: Record<string, string>
  private readonly fetchImpl: typeof fetch

  constructor(options: HttpClientOptions) {
    this.apiKey = options.apiKey
    this.baseURL = options.baseURL.replace(/\/$/, "")
    this.timeout = options.timeout
    this.maxRetries = options.maxRetries
    this.defaultHeaders = options.defaultHeaders ?? {}

    const impl = options.fetch ?? globalThis.fetch
    if (!impl) {
      throw new ConnectionError(
        "No global fetch implementation found. Use Node 18+ or pass a `fetch` option.",
      )
    }
    this.fetchImpl = impl
  }

  /** Perform a request and return the parsed JSON body plus response headers. */
  async request<T>(options: RequestOptions): Promise<{ data: T; response: Response }> {
    const response = await this.raw(options)
    const text = await response.text()
    const data = text ? (JSON.parse(text) as T) : (undefined as T)
    return { data, response }
  }

  /**
   * Perform a request and return the raw Response. Used by the streaming path,
   * which reads `response.body` directly. Errors are still parsed and thrown.
   */
  async raw(options: RequestOptions): Promise<Response> {
    const url = this.buildUrl(options.path, options.query)
    const headers = this.buildHeaders(options)
    const init: RequestInit = {
      method: options.method ?? "GET",
      headers,
    }
    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body)
    }

    let lastError: unknown
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, init, options.signal)
        if (response.ok) return response

        const error = await this.toError(response)
        if (isRetryable(error) && attempt < this.maxRetries) {
          lastError = error
          await sleep(this.backoff(attempt, error))
          continue
        }
        throw error
      } catch (err) {
        if (err instanceof ConnectionError && attempt < this.maxRetries) {
          lastError = err
          await sleep(this.backoff(attempt))
          continue
        }
        throw err
      }
    }

    // Loop only exits via return/throw except when the last attempt was a
    // retryable failure that exhausted the budget.
    throw lastError instanceof Error
      ? lastError
      : new ConnectionError("Request failed after exhausting retries.")
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    userSignal?: AbortSignal,
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)
    const onAbort = () => controller.abort()
    userSignal?.addEventListener("abort", onAbort, { once: true })

    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal })
    } catch (err) {
      if (userSignal?.aborted) {
        throw new ConnectionError("Request aborted by caller.", { cause: err })
      }
      if (controller.signal.aborted) {
        throw new ConnectionError(`Request timed out after ${this.timeout}ms.`, { cause: err })
      }
      throw new ConnectionError("Failed to reach the HoodCompute API.", { cause: err })
    } finally {
      clearTimeout(timer)
      userSignal?.removeEventListener("abort", onAbort)
    }
  }

  private async toError(response: Response) {
    let body: ApiErrorBody | undefined
    try {
      const parsed = (await response.json()) as { error?: ApiErrorBody } | ApiErrorBody
      body = "error" in parsed && parsed.error ? parsed.error : (parsed as ApiErrorBody)
    } catch {
      body = undefined
    }
    const requestId = response.headers.get("x-request-id") ?? undefined
    return errorFromResponse(response.status, body, requestId)
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(`${this.baseURL}${path}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }
    return url.toString()
  }

  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: options.stream ? "text/event-stream" : "application/json",
      "User-Agent": `hoodcompute-sdk-js/${SDK_VERSION}`,
      ...this.defaultHeaders,
    }
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json"
    }
    return headers
  }

  private backoff(attempt: number, error?: unknown): number {
    // Honor a server-suggested retry_after when present (in seconds).
    const retryAfter =
      error &&
      typeof error === "object" &&
      "details" in error &&
      typeof (error as { details?: Record<string, unknown> }).details?.retry_after === "number"
        ? ((error as { details: Record<string, unknown> }).details.retry_after as number) * 1000
        : undefined
    if (retryAfter !== undefined) return retryAfter
    return Math.min(1000 * 2 ** attempt, 8000)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
