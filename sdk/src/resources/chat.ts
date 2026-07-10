/**
 * Chat completions. OpenAI-compatible in request and response shape, with the
 * job ID and on-chain settlement attached to every result.
 */

import type { HttpClient } from "../http.js"
import type {
  ChatCompletion,
  ChatCompletionCreateParams,
} from "../types.js"
import { ChatCompletionStream } from "../streaming.js"

/** Raw response body from the completions endpoint, before SDK normalization. */
interface RawChatCompletion {
  id: string
  object: "chat.completion"
  created: number
  model: string
  choices: ChatCompletion["choices"]
  usage: ChatCompletion["usage"]
}

export class Completions {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a chat completion.
   *
   * Pass `stream: true` to receive a {@link ChatCompletionStream}. Otherwise a
   * fully resolved {@link ChatCompletion} is returned.
   */
  create(
    params: ChatCompletionCreateParams & { stream: true },
    options?: { signal?: AbortSignal },
  ): Promise<ChatCompletionStream>
  create(
    params: ChatCompletionCreateParams & { stream?: false },
    options?: { signal?: AbortSignal },
  ): Promise<ChatCompletion>
  create(
    params: ChatCompletionCreateParams,
    options?: { signal?: AbortSignal },
  ): Promise<ChatCompletion | ChatCompletionStream>
  async create(
    params: ChatCompletionCreateParams,
    options: { signal?: AbortSignal } = {},
  ): Promise<ChatCompletion | ChatCompletionStream> {
    if (params.stream) {
      const response = await this.http.raw({
        method: "POST",
        path: "/chat/completions",
        body: params,
        stream: true,
        signal: options.signal,
      })
      return new ChatCompletionStream(response)
    }

    const { data, response } = await this.http.request<RawChatCompletion>({
      method: "POST",
      path: "/chat/completions",
      body: params,
      signal: options.signal,
    })

    const creditsRemaining = response.headers.get("x-hoodcompute-credits-remaining")
    return {
      ...data,
      jobId: response.headers.get("x-hoodcompute-job-id") ?? data.id,
      settlementTx: response.headers.get("x-hoodcompute-settlement-tx"),
      creditsCharged: null,
      creditsRemaining: creditsRemaining !== null ? Number(creditsRemaining) : null,
    }
  }
}

export class Chat {
  readonly completions: Completions
  constructor(http: HttpClient) {
    this.completions = new Completions(http)
  }
}
