/**
 * Jobs. Retrieve job status, fetch on-chain receipts, and open disputes.
 */

import type { HttpClient } from "../http.js"
import type {
  DisputeResult,
  Job,
  JobList,
  JobListParams,
  JobReceipt,
  JobStatus,
  ModelTier,
  Usage,
} from "../types.js"
import { NotFoundError } from "../errors.js"

interface RawJob {
  id: string
  object: "job"
  status: JobStatus
  model: string
  tier: ModelTier
  credits_charged: number
  usdg_value: number
  worker_address: string
  created_at: string
  completed_at: string | null
  on_chain: {
    escrow_tx: string
    settlement_tx: string
    escrow_address: string
    block_number: number
    proof_hash: string
  } | null
  usage: Usage | null
}

function normalize(raw: RawJob): Job {
  return {
    id: raw.id,
    object: raw.object,
    status: raw.status,
    model: raw.model,
    tier: raw.tier,
    creditsCharged: raw.credits_charged,
    usdgValue: raw.usdg_value,
    workerAddress: raw.worker_address,
    createdAt: raw.created_at,
    completedAt: raw.completed_at,
    onChain: raw.on_chain
      ? {
          escrowTx: raw.on_chain.escrow_tx,
          settlementTx: raw.on_chain.settlement_tx,
          escrowAddress: raw.on_chain.escrow_address,
          blockNumber: raw.on_chain.block_number,
          proofHash: raw.on_chain.proof_hash,
        }
      : null,
    usage: raw.usage,
  }
}

export class Jobs {
  constructor(private readonly http: HttpClient) {}

  /** Retrieve a job by ID, including its on-chain settlement detail. */
  async get(jobId: string, options: { signal?: AbortSignal } = {}): Promise<Job> {
    const { data } = await this.http.request<RawJob>({
      path: `/jobs/${encodeURIComponent(jobId)}`,
      signal: options.signal,
    })
    return normalize(data)
  }

  /** List jobs for the authenticated key, most recent first. */
  async list(params: JobListParams = {}, options: { signal?: AbortSignal } = {}): Promise<JobList> {
    const { data } = await this.http.request<{
      object: "list"
      data: RawJob[]
      has_more: boolean
      next_cursor: string | null
    }>({
      path: "/jobs",
      query: {
        limit: params.limit,
        before: params.before,
        after: params.after,
        status: params.status,
        model: params.model,
      },
      signal: options.signal,
    })
    return {
      object: "list",
      data: data.data.map(normalize),
      hasMore: data.has_more,
      nextCursor: data.next_cursor,
    }
  }

  /**
   * Fetch the on-chain receipt for a settled job. Throws if the job exists but
   * has not settled yet.
   */
  async getReceipt(jobId: string, options: { signal?: AbortSignal } = {}): Promise<JobReceipt> {
    const job = await this.get(jobId, options)
    if (!job.onChain) {
      throw new NotFoundError(
        `Job ${jobId} has status "${job.status}" and no on-chain receipt yet.`,
        { code: "receipt_not_ready" },
      )
    }
    return {
      jobId: job.id,
      model: job.model,
      tier: job.tier,
      creditsCharged: job.creditsCharged,
      usdgValue: job.usdgValue,
      workerAddress: job.workerAddress,
      escrowTx: job.onChain.escrowTx,
      settlementTx: job.onChain.settlementTx,
      blockNumber: job.onChain.blockNumber,
      proofHash: job.onChain.proofHash,
    }
  }

  /**
   * Open a dispute on a completed job. Must be called within 60 seconds of
   * receiving the final output token.
   *
   * @param receivedOutputHash SHA-256 of the full response text you received,
   *   formatted as `sha256:<hex>`.
   */
  async dispute(
    jobId: string,
    receivedOutputHash: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<DisputeResult> {
    const { data } = await this.http.request<{
      job_id: string
      dispute_opened: boolean
      your_hash: string
      worker_hash: string
      dispute_tx?: string | null
      arbitration_window_hours?: number | null
    }>({
      method: "POST",
      path: `/jobs/${encodeURIComponent(jobId)}/dispute`,
      body: { received_output_hash: receivedOutputHash },
      signal: options.signal,
    })
    return {
      jobId: data.job_id,
      disputeOpened: data.dispute_opened,
      yourHash: data.your_hash,
      workerHash: data.worker_hash,
      disputeTx: data.dispute_tx ?? null,
      arbitrationWindowHours: data.arbitration_window_hours ?? null,
    }
  }
}
