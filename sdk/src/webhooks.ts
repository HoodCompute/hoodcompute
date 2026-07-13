/**
 * Webhook signature verification.
 *
 * HoodCompute signs every webhook delivery with an HMAC-SHA256 over
 * `{timestamp}.{raw_body}` using your webhook secret. Always verify the
 * signature against the raw request body, before parsing JSON, to confirm the
 * delivery is authentic and untampered.
 */

import crypto from "node:crypto"
import type {
  WebhookEvent,
  JobCompletedEvent,
  CreditLowEvent,
  WorkerSlashedEvent,
} from "./webhook-types.js"

export interface VerifyWebhookOptions {
  /**
   * Reject deliveries whose timestamp is older than this many seconds, to
   * guard against replay. Set to 0 to disable. Defaults to 300 (5 minutes).
   */
  toleranceSeconds?: number
  /** Current Unix time in seconds. Injectable for testing. */
  now?: number
}

/**
 * Verify a webhook signature against the raw request body.
 *
 * @param rawBody The exact bytes of the request body, as a string. Do not parse
 *   or re-serialize it first.
 * @param signature Value of the `HoodCompute-Signature` header.
 * @param secret Your webhook signing secret.
 * @returns `true` when the signature is valid and within tolerance.
 *
 * @example
 * const ok = verifyWebhookSignature(rawBody, req.headers["hoodcompute-signature"], secret)
 * if (!ok) return res.status(400).end()
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
  options: VerifyWebhookOptions = {},
): boolean {
  if (!signature) return false

  const match = /^t=(\d+),v1=([0-9a-f]+)$/.exec(signature.trim())
  if (!match) return false
  const timestamp = match[1] as string
  const received = match[2] as string

  const tolerance = options.toleranceSeconds ?? 300
  if (tolerance > 0) {
    const now = options.now ?? Math.floor(Date.now() / 1000)
    if (Math.abs(now - Number(timestamp)) > tolerance) return false
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")

  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Verify a webhook signature and, on success, parse the body into a typed
 * event. Throws if the signature is invalid.
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
  options?: VerifyWebhookOptions,
): WebhookEvent {
  if (!verifyWebhookSignature(rawBody, signature, secret, options)) {
    throw new Error("Invalid HoodCompute webhook signature.")
  }
  return JSON.parse(rawBody) as WebhookEvent
}

export type {
  WebhookEvent,
  JobCompletedEvent,
  CreditLowEvent,
  WorkerSlashedEvent,
}
