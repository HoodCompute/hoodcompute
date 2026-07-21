/**
 * Network and client defaults for HoodCompute.
 */

/** Default HoodCompute API base URL. */
export const DEFAULT_BASE_URL = "https://api.hoodcompute.com/v1"

/** Robinhood Chain mainnet chain ID. */
export const ROBINHOOD_CHAIN_ID = 4663

/** Base URL of the Robinhood Chain Blockscout explorer. */
export const BLOCKSCOUT_BASE_URL = "https://robinhoodchain.blockscout.com"

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 120_000

/** Default number of automatic retries on transient failures. */
export const DEFAULT_MAX_RETRIES = 2

/** SDK version, surfaced in the User-Agent header. Keep in sync with package.json. */
export const SDK_VERSION = "0.2.2"

/**
 * Build a Blockscout explorer link for a Robinhood Chain transaction hash.
 *
 * @example
 * explorerTxUrl(receipt.settlementTx)
 * // "https://robinhoodchain.blockscout.com/tx/0x..."
 */
export function explorerTxUrl(txHash: string): string {
  return `${BLOCKSCOUT_BASE_URL}/tx/${txHash}`
}

/**
 * Build a Blockscout explorer link for a Robinhood Chain address.
 */
export function explorerAddressUrl(address: string): string {
  return `${BLOCKSCOUT_BASE_URL}/address/${address}`
}
