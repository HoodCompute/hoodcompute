/**
 * Public type definitions for the HoodCompute SDK.
 *
 * The chat completion request and response shapes mirror the OpenAI Chat
 * Completions API, so existing OpenAI integrations map over cleanly. Fields
 * unique to HoodCompute (job IDs, on-chain settlement, credit accounting) are
 * namespaced under `hoodcompute` or exposed as first-class receipt objects.
 */

/** Pricing tier a model is grouped under. */
export type ModelTier = "lite" | "standard" | "pro" | "max"

/** Role of a chat message. */
export type ChatRole = "system" | "user" | "assistant"

/** A single message in a conversation. */
export interface ChatMessage {
  role: ChatRole
  content: string
}

/** Parameters accepted by `client.chat.completions.create`. */
export interface ChatCompletionCreateParams {
  /** Model ID to run, for example `qwen3-8b`. See `client.models.list()`. */
  model: string
  /** Ordered list of messages in the conversation. */
  messages: ChatMessage[]
  /** When `true`, tokens are streamed back as they are generated. */
  stream?: boolean
  /** Maximum number of tokens to generate. */
  max_tokens?: number
  /** Sampling temperature, 0.0 to 2.0. */
  temperature?: number
  /** Nucleus sampling probability. */
  top_p?: number
  /** Stop sequence or sequences. */
  stop?: string | string[]
  /** Penalize repeated tokens, -2.0 to 2.0. */
  frequency_penalty?: number
  /** Penalize tokens that have already appeared, -2.0 to 2.0. */
  presence_penalty?: number
  /** Seed for sampling. Not guaranteed under distributed inference. */
  seed?: number
}

/** Token accounting for a completed job. */
export interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

/** A choice in a non-streaming chat completion. */
export interface ChatCompletionChoice {
  index: number
  message: ChatMessage
  finish_reason: string | null
}

/**
 * A non-streaming chat completion response.
 *
 * In addition to the OpenAI-compatible fields, HoodCompute attaches the job ID
 * and the on-chain settlement transaction so a completion can be verified
 * independently on Robinhood Chain.
 */
export interface ChatCompletion {
  id: string
  object: "chat.completion"
  created: number
  model: string
  choices: ChatCompletionChoice[]
  usage: Usage
  /** HoodCompute job ID for this completion. */
  jobId: string
  /** Robinhood Chain settlement transaction hash, once available. */
  settlementTx: string | null
  /** Credits charged for this job. */
  creditsCharged: number | null
  /** Credit balance remaining after this job. */
  creditsRemaining: number | null
}

/** The incremental content in a streaming chunk. */
export interface ChatCompletionDelta {
  role?: ChatRole
  content?: string
}

/** A choice in a streaming chat completion chunk. */
export interface ChatCompletionChunkChoice {
  index: number
  delta: ChatCompletionDelta
  finish_reason: string | null
}

/** A single Server-Sent Event chunk in a streaming completion. */
export interface ChatCompletionChunk {
  id: string
  object: "chat.completion.chunk"
  created: number
  model: string
  choices: ChatCompletionChunkChoice[]
}

/**
 * On-chain receipt for a settled job.
 *
 * Every settled job produces a receipt whose transaction hashes resolve on the
 * Robinhood Chain Blockscout explorer. The receipt never contains prompt or
 * completion content.
 */
export interface JobReceipt {
  jobId: string
  model: string
  tier: ModelTier
  creditsCharged: number
  usdgValue: number
  workerAddress: string
  escrowTx: string
  settlementTx: string
  blockNumber: number
  proofHash: string
}

/** Lifecycle status of a job. */
export type JobStatus =
  | "pending"
  | "processing"
  | "settling"
  | "settled"
  | "failed"
  | "refunded"
  | "disputed"

/** On-chain settlement detail attached to a retrieved job. */
export interface JobOnChain {
  escrowTx: string
  settlementTx: string
  escrowAddress: string
  blockNumber: number
  proofHash: string
}

/** A job record retrieved from the Jobs API. */
export interface Job {
  id: string
  object: "job"
  status: JobStatus
  model: string
  tier: ModelTier
  creditsCharged: number
  usdgValue: number
  workerAddress: string
  createdAt: string
  completedAt: string | null
  onChain: JobOnChain | null
  usage: Usage | null
}

/** Parameters for `client.jobs.list`. */
export interface JobListParams {
  /** Number of results to return, up to 100. Defaults to 20. */
  limit?: number
  /** Return jobs created before this job ID (cursor pagination). */
  before?: string
  /** Return jobs created after this job ID. */
  after?: string
  /** Filter by status. */
  status?: JobStatus
  /** Filter by model ID. */
  model?: string
}

/** A page of jobs. */
export interface JobList {
  object: "list"
  data: Job[]
  hasMore: boolean
  nextCursor: string | null
}

/** Result of opening a dispute on a job. */
export interface DisputeResult {
  jobId: string
  disputeOpened: boolean
  yourHash: string
  workerHash: string
  disputeTx: string | null
  arbitrationWindowHours: number | null
}

/** HoodCompute-specific metadata attached to a model. */
export interface ModelMeta {
  tier: ModelTier
  creditsPerRequest: number
  creditsPer1kTokens: number
  activeWorkers: number
  medianLatencyMs: number
  parameters: string
  contextWindow: number
}

/** A model available on the network. */
export interface Model {
  id: string
  object: "model"
  created: number
  ownedBy: string
  hoodcompute: ModelMeta
}

/** A page of models. */
export interface ModelList {
  object: "list"
  data: Model[]
}

/** Account and credit balance for the authenticated key. */
export interface Account {
  wallet: string
  creditsRemaining: number
  usdgValue: number
  lastTopupAt: string | null
  apiKeyCreatedAt: string | null
}
