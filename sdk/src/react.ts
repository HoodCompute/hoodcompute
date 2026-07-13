/**
 * @hoodcompute/sdk/react
 *
 * React hooks for building chat UIs on top of the HoodCompute network.
 * `react` is a peer dependency, imported only from this subpath, so the core
 * SDK stays framework-agnostic.
 */

import { useCallback, useMemo, useRef, useState } from "react"
import { HoodComputeClient } from "./client.js"
import type { ChatMessage } from "./types.js"
import type { StreamReceipt } from "./streaming.js"

/** Status of the chat hook. */
export type ChatStatus = "idle" | "streaming" | "settling" | "error"

/** Credit balance surfaced by the hook. */
export interface ChatBalance {
  creditsRemaining: number
  usdgValue: number
}

export interface UseHoodComputeChatOptions {
  /** Model ID to run. */
  model: string
  /**
   * API key. Prefer a server-side proxy in production. When you must call from
   * the browser during beta, use a `NEXT_PUBLIC_`-scoped key you can revoke.
   */
  apiKey?: string
  /** Override the API base URL. */
  baseURL?: string
  /** Reuse an existing client instead of constructing one from `apiKey`. */
  client?: HoodComputeClient
  /** Optional system prompt, prepended to every request. */
  systemPrompt?: string
  /** Called after each job settles, with the stream receipt. */
  onComplete?: (receipt: StreamReceipt) => void
  /** Called when a request fails. */
  onError?: (error: Error) => void
}

export interface UseHoodComputeChatResult {
  /** Send a user message and stream the assistant reply into `messages`. */
  send: (message: string) => Promise<void>
  /** The running conversation. */
  messages: ChatMessage[]
  /** Current status of the hook. */
  status: ChatStatus
  /** Latest known credit balance, or null before the first completion. */
  balance: ChatBalance | null
  /** Receipt from the most recent settled job. */
  lastReceipt: StreamReceipt | null
  /** The last error, or null. */
  error: Error | null
  /** Clear the conversation and reset status. */
  reset: () => void
}

/**
 * A chat hook that streams tokens and tracks on-chain settlement.
 *
 * @example
 * const { send, messages, status, balance } = useHoodComputeChat({
 *   model: "qwen3-8b",
 *   apiKey: process.env.NEXT_PUBLIC_HOODCOMPUTE_API_KEY,
 * })
 */
export function useHoodComputeChat(
  options: UseHoodComputeChatOptions,
): UseHoodComputeChatResult {
  const { model, apiKey, baseURL, client: providedClient, systemPrompt, onComplete, onError } =
    options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>("idle")
  const [balance, setBalance] = useState<ChatBalance | null>(null)
  const [lastReceipt, setLastReceipt] = useState<StreamReceipt | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const client = useMemo(
    () => providedClient ?? new HoodComputeClient({ apiKey, baseURL }),
    [providedClient, apiKey, baseURL],
  )

  // Keep the latest callbacks without re-creating `send` on every render.
  const callbacks = useRef({ onComplete, onError })
  callbacks.current = { onComplete, onError }

  const send = useCallback(
    async (message: string) => {
      setError(null)
      setStatus("streaming")

      const userMessage: ChatMessage = { role: "user", content: message }
      const history = [...messages, userMessage]
      setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }])

      const outbound: ChatMessage[] = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...history]
        : history

      try {
        const stream = await client.chat.completions.create({
          model,
          messages: outbound,
          stream: true,
        })

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content
          if (!delta) continue
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === "assistant") {
              next[next.length - 1] = { ...last, content: last.content + delta }
            }
            return next
          })
        }

        setStatus("settling")
        const receipt = stream.receipt
        setLastReceipt(receipt)
        if (receipt.creditsRemaining !== null) {
          setBalance({
            creditsRemaining: receipt.creditsRemaining,
            usdgValue: Number((receipt.creditsRemaining * 0.01).toFixed(2)),
          })
        }
        callbacks.current.onComplete?.(receipt)
        setStatus("idle")
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error(String(err))
        setError(normalized)
        setStatus("error")
        callbacks.current.onError?.(normalized)
      }
    },
    [client, model, messages, systemPrompt],
  )

  const reset = useCallback(() => {
    setMessages([])
    setStatus("idle")
    setError(null)
    setLastReceipt(null)
  }, [])

  return { send, messages, status, balance, lastReceipt, error, reset }
}
