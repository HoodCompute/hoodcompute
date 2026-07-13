/**
 * Server-Sent Events parsing and the streaming chat completion object.
 */

import type { ChatCompletionChunk } from "./types.js"
import { ConnectionError } from "./errors.js"

/**
 * Lightweight settlement metadata surfaced from a streaming response once it
 * closes. Values are read from response headers as the network makes them
 * available. For the full on-chain receipt, call `client.jobs.getReceipt(jobId)`.
 */
export interface StreamReceipt {
  jobId: string | null
  settlementTx: string | null
  escrowTx: string | null
  workerAddress: string | null
  creditsRemaining: number | null
}

/**
 * An async-iterable stream of chat completion chunks.
 *
 * Iterate it with `for await` to consume tokens as they arrive. Once iteration
 * finishes, `jobId` and `receipt` are populated from the response.
 *
 * @example
 * const stream = await client.chat.completions.create({ ..., stream: true })
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
 * }
 * console.log(stream.receipt.settlementTx)
 */
export class ChatCompletionStream implements AsyncIterable<ChatCompletionChunk> {
  /** HoodCompute job ID for this completion, from the response header. */
  jobId: string | null
  /** Settlement metadata, populated once the stream finishes. */
  receipt: StreamReceipt

  private readonly response: Response

  constructor(response: Response) {
    this.response = response
    this.jobId = response.headers.get("x-hoodcompute-job-id")
    this.receipt = this.readReceipt()
  }

  async *[Symbol.asyncIterator](): AsyncIterator<ChatCompletionChunk> {
    const body = this.response.body
    if (!body) {
      throw new ConnectionError("The streaming response contained no body.")
    }

    const decoder = new TextDecoder()
    const reader = body.getReader()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by a blank line.
        let boundary = buffer.indexOf("\n\n")
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)

          const chunk = parseEvent(rawEvent)
          if (chunk === DONE) {
            return
          }
          if (chunk) {
            yield chunk
          }
          boundary = buffer.indexOf("\n\n")
        }
      }

      // Flush a trailing event with no terminating blank line.
      const trailing = parseEvent(buffer)
      if (trailing && trailing !== DONE) {
        yield trailing
      }
    } finally {
      reader.releaseLock()
      // Refresh the receipt in case trailer headers landed after the stream.
      this.receipt = this.readReceipt()
    }
  }

  /** Convenience: collect the full concatenated text of the stream. */
  async text(): Promise<string> {
    let out = ""
    for await (const chunk of this) {
      out += chunk.choices[0]?.delta?.content ?? ""
    }
    return out
  }

  private readReceipt(): StreamReceipt {
    const h = this.response.headers
    const creditsRemaining = h.get("x-hoodcompute-credits-remaining")
    return {
      jobId: h.get("x-hoodcompute-job-id"),
      settlementTx: h.get("x-hoodcompute-settlement-tx"),
      escrowTx: h.get("x-hoodcompute-tx-hash"),
      workerAddress: h.get("x-hoodcompute-worker"),
      creditsRemaining: creditsRemaining !== null ? Number(creditsRemaining) : null,
    }
  }
}

/** Sentinel marking the `[DONE]` terminator. */
const DONE = Symbol("done")

/**
 * Parse one raw SSE event block into a chunk. Returns `DONE` on the terminator,
 * `null` for events without usable data (comments, empty blocks).
 */
function parseEvent(raw: string): ChatCompletionChunk | typeof DONE | null {
  const dataLines: string[] = []
  for (const line of raw.split("\n")) {
    const trimmed = line.trimEnd()
    if (trimmed.startsWith(":") || trimmed === "") continue
    if (trimmed.startsWith("data:")) {
      dataLines.push(trimmed.slice(5).trimStart())
    }
  }
  if (dataLines.length === 0) return null

  const data = dataLines.join("\n")
  if (data === "[DONE]") return DONE

  try {
    return JSON.parse(data) as ChatCompletionChunk
  } catch {
    return null
  }
}
