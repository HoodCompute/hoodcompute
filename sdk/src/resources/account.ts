/**
 * Account. The wallet and credit balance tied to the authenticated API key.
 */

import type { HttpClient } from "../http.js"
import type { Account } from "../types.js"

interface RawAccount {
  wallet: string
  credits_remaining: number
  usdg_value: number
  last_topup_at: string | null
  api_key_created_at: string | null
}

export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  /** Retrieve the current account, including the live credit balance. */
  async get(options: { signal?: AbortSignal } = {}): Promise<Account> {
    const { data } = await this.http.request<RawAccount>({
      path: "/account",
      signal: options.signal,
    })
    return {
      wallet: data.wallet,
      creditsRemaining: data.credits_remaining,
      usdgValue: data.usdg_value,
      lastTopupAt: data.last_topup_at ?? null,
      apiKeyCreatedAt: data.api_key_created_at ?? null,
    }
  }
}
