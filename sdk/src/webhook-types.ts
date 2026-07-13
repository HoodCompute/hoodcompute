/**
 * Webhook event types delivered to your endpoint.
 */

import type { ModelTier } from "./types.js"

/** Every webhook event that HoodCompute can deliver. */
export type WebhookEventType =
  | "job.submitted"
  | "job.processing"
  | "job.completed"
  | "job.failed"
  | "job.timeout"
  | "job.disputed"
  | "credit.low"
  | "credit.topup"
  | "worker.registered"
  | "worker.slashed"

/** Shared envelope on every webhook delivery. */
interface WebhookEnvelope<E extends WebhookEventType, D> {
  id: string
  event: E
  created_at: string
  api_version: string
  data: D
}

export type JobCompletedEvent = WebhookEnvelope<
  "job.completed",
  {
    job_id: string
    model: string
    tier: ModelTier
    credits_charged: number
    usdg_value: number
    worker_address: string
    settlement_tx: string
    block_number: number
    prompt_tokens: number
    completion_tokens: number
    credits_remaining: number
  }
>

export type CreditLowEvent = WebhookEnvelope<
  "credit.low",
  {
    credits_remaining: number
    usdg_value: number
    threshold: number
  }
>

export type WorkerSlashedEvent = WebhookEnvelope<
  "worker.slashed",
  {
    worker_address: string
    slash_amount_hoodc: number
    slash_tx: string
    reason: string
    related_job_id: string
  }
>

/** A generic event for types without a specialized payload shape. */
export type GenericWebhookEvent = WebhookEnvelope<WebhookEventType, Record<string, unknown>>

/**
 * A discriminated union of webhook events. Narrow on `event.event` to get the
 * typed `data` for the specialized events; other events fall through to the
 * generic shape.
 */
export type WebhookEvent =
  | JobCompletedEvent
  | CreditLowEvent
  | WorkerSlashedEvent
  | GenericWebhookEvent
