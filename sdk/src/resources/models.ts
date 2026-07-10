/**
 * Models. Reflects the live worker pool: a model is listed only while at least
 * one worker is hosting it.
 */

import type { HttpClient } from "../http.js"
import type { Model, ModelList, ModelTier } from "../types.js"

interface RawModel {
  id: string
  object: "model"
  created: number
  owned_by: string
  hoodcompute: {
    tier: ModelTier
    credits_per_request: number
    credits_per_1k_tokens: number
    active_workers: number
    median_latency_ms: number
    parameters: string
    context_window: number
  }
}

function normalize(raw: RawModel): Model {
  return {
    id: raw.id,
    object: raw.object,
    created: raw.created,
    ownedBy: raw.owned_by,
    hoodcompute: {
      tier: raw.hoodcompute.tier,
      creditsPerRequest: raw.hoodcompute.credits_per_request,
      creditsPer1kTokens: raw.hoodcompute.credits_per_1k_tokens,
      activeWorkers: raw.hoodcompute.active_workers,
      medianLatencyMs: raw.hoodcompute.median_latency_ms,
      parameters: raw.hoodcompute.parameters,
      contextWindow: raw.hoodcompute.context_window,
    },
  }
}

export class Models {
  constructor(private readonly http: HttpClient) {}

  /** List every model currently available on the network. */
  async list(options: { signal?: AbortSignal } = {}): Promise<ModelList> {
    const { data } = await this.http.request<{ object: "list"; data: RawModel[] }>({
      path: "/models",
      signal: options.signal,
    })
    return { object: "list", data: data.data.map(normalize) }
  }

  /** Retrieve a single model by ID, including its live worker count. */
  async retrieve(modelId: string, options: { signal?: AbortSignal } = {}): Promise<Model> {
    const { data } = await this.http.request<RawModel>({
      path: `/models/${encodeURIComponent(modelId)}`,
      signal: options.signal,
    })
    return normalize(data)
  }
}
