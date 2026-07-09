/**
 * The HoodCompute client. Entry point for chat completions, models, jobs, and
 * account access against the decentralized inference network.
 */

import { HttpClient } from "./http.js"
import { HoodComputeError } from "./errors.js"
import {
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
} from "./constants.js"
import { Chat } from "./resources/chat.js"
import { Models } from "./resources/models.js"
import { Jobs } from "./resources/jobs.js"
import { AccountResource } from "./resources/account.js"

export interface HoodComputeClientOptions {
  /**
   * API key, formatted `hoodc_live_...`. Falls back to the
   * `HOODCOMPUTE_API_KEY` environment variable when omitted.
   */
  apiKey?: string
  /** API base URL. Defaults to `https://api.hoodcompute.com/v1`. */
  baseURL?: string
  /** Per-request timeout in milliseconds. Defaults to 120000. */
  timeout?: number
  /** Automatic retries on 5xx, 429, and connection failures. Defaults to 2. */
  maxRetries?: number
  /** Headers added to every request. */
  defaultHeaders?: Record<string, string>
  /** Custom fetch implementation. Defaults to the global `fetch`. */
  fetch?: typeof fetch
}

export class HoodComputeClient {
  readonly chat: Chat
  readonly models: Models
  readonly jobs: Jobs
  readonly account: AccountResource

  constructor(options: HoodComputeClientOptions = {}) {
    const apiKey = options.apiKey ?? readEnv("HOODCOMPUTE_API_KEY")
    if (!apiKey) {
      throw new HoodComputeError(
        "Missing API key. Pass `apiKey` to the client or set the HOODCOMPUTE_API_KEY environment variable.",
        { code: "missing_api_key" },
      )
    }

    const http = new HttpClient({
      apiKey,
      baseURL: options.baseURL ?? DEFAULT_BASE_URL,
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      defaultHeaders: options.defaultHeaders,
      fetch: options.fetch,
    })

    this.chat = new Chat(http)
    this.models = new Models(http)
    this.jobs = new Jobs(http)
    this.account = new AccountResource(http)
  }
}

function readEnv(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name]
  }
  return undefined
}
