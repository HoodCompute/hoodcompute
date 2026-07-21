import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClient } from "../src/http"
import {
  AuthenticationError,
  ConnectionError,
  InsufficientCreditsError,
  InvalidRequestError,
} from "../src/errors"

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? "" : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  })
}

function makeClient(fetchImpl: typeof fetch, overrides: Partial<{ maxRetries: number }> = {}) {
  return new HttpClient({
    apiKey: "sk_test_123",
    baseURL: "https://api.hoodcompute.com/v1",
    timeout: 5_000,
    maxRetries: overrides.maxRetries ?? 2,
    fetch: fetchImpl,
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("HttpClient request building", () => {
  it("sets the method, auth, and default headers, and serializes the body", async () => {
    let capturedUrl = ""
    let capturedInit: RequestInit = {}
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      capturedUrl = url
      capturedInit = init
      return json(200, { ok: true })
    }) as unknown as typeof fetch

    const client = makeClient(fetchImpl)
    await client.request({ method: "POST", path: "/chat/completions", body: { model: "m" } })

    expect(capturedUrl).toBe("https://api.hoodcompute.com/v1/chat/completions")
    expect(capturedInit.method).toBe("POST")
    const headers = capturedInit.headers as Record<string, string>
    expect(headers.Authorization).toBe("Bearer sk_test_123")
    expect(headers["Content-Type"]).toBe("application/json")
    expect(headers["User-Agent"]).toMatch(/^hoodcompute-sdk-js\//)
    expect(capturedInit.body).toBe(JSON.stringify({ model: "m" }))
  })

  it("appends defined query parameters and drops undefined ones", async () => {
    let capturedUrl = ""
    const fetchImpl = vi.fn(async (url: string) => {
      capturedUrl = url
      return json(200, {})
    }) as unknown as typeof fetch

    await makeClient(fetchImpl).request({
      path: "/models",
      query: { limit: 10, cursor: undefined },
    })

    expect(capturedUrl).toContain("limit=10")
    expect(capturedUrl).not.toContain("cursor")
  })

  it("parses and returns the JSON body", async () => {
    const fetchImpl = vi.fn(async () => json(200, { id: "acct_1", credits: 500 })) as unknown as typeof fetch
    const { data } = await makeClient(fetchImpl).request<{ id: string; credits: number }>({
      path: "/account",
    })
    expect(data).toEqual({ id: "acct_1", credits: 500 })
  })
})

describe("HttpClient error handling", () => {
  it("maps a 402 to InsufficientCreditsError and does not retry", async () => {
    const fetchImpl = vi.fn(async () =>
      json(402, { error: { code: "insufficient_credits", message: "top up" } }),
    ) as unknown as typeof fetch
    const client = makeClient(fetchImpl)

    await expect(client.request({ path: "/chat/completions", method: "POST", body: {} })).rejects.toBeInstanceOf(
      InsufficientCreditsError,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("does not retry a 401", async () => {
    const fetchImpl = vi.fn(async () => json(401, { message: "bad key" })) as unknown as typeof fetch
    const client = makeClient(fetchImpl)
    await expect(client.request({ path: "/account" })).rejects.toBeInstanceOf(AuthenticationError)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("surfaces the x-request-id from the response", async () => {
    const fetchImpl = vi.fn(async () =>
      json(400, { message: "nope" }, { "x-request-id": "req_xyz" }),
    ) as unknown as typeof fetch
    try {
      await makeClient(fetchImpl).request({ path: "/account" })
      throw new Error("expected the request to reject")
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidRequestError)
      expect((err as InvalidRequestError).requestId).toBe("req_xyz")
    }
  })
})

describe("HttpClient retries", () => {
  it("retries a 503 and then succeeds", async () => {
    vi.useFakeTimers()
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(503, { code: "no_workers_available", message: "busy" }))
      .mockResolvedValueOnce(json(200, { ok: true })) as unknown as typeof fetch

    const client = makeClient(fetchImpl)
    const pending = client.request<{ ok: boolean }>({ path: "/chat/completions", method: "POST", body: {} })
    await vi.runAllTimersAsync()
    const { data } = await pending

    expect(data).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("retries a network failure and then succeeds", async () => {
    vi.useFakeTimers()
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(json(200, { ok: true })) as unknown as typeof fetch

    const client = makeClient(fetchImpl)
    const pending = client.request<{ ok: boolean }>({ path: "/account" })
    await vi.runAllTimersAsync()
    const { data } = await pending

    expect(data).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("gives up with a ConnectionError after exhausting retries", async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("network down")) as unknown as typeof fetch

    const client = makeClient(fetchImpl, { maxRetries: 1 })
    const pending = client.request({ path: "/account" })
    const assertion = expect(pending).rejects.toBeInstanceOf(ConnectionError)
    await vi.runAllTimersAsync()
    await assertion
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("does not retry a request aborted by the caller", async () => {
    const controller = new AbortController()
    const fetchImpl = vi.fn(async () => {
      controller.abort()
      throw new DOMException("The operation was aborted.", "AbortError")
    }) as unknown as typeof fetch

    const client = makeClient(fetchImpl)
    await expect(
      client.request({ path: "/account", signal: controller.signal }),
    ).rejects.toThrow(/aborted by caller/i)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("does not issue the request at all when the signal is already aborted", async () => {
    const controller = new AbortController()
    controller.abort()
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.signal?.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError")
      }
      return json(200, { ok: true })
    }) as unknown as typeof fetch

    const client = makeClient(fetchImpl)
    await expect(
      client.request({ path: "/account", signal: controller.signal }),
    ).rejects.toThrow(/aborted by caller/i)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("waits for the Retry-After header before retrying a 429", async () => {
    vi.useFakeTimers()
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(429, { message: "slow down" }, { "retry-after": "1" }))
      .mockResolvedValueOnce(json(200, { ok: true })) as unknown as typeof fetch

    const client = makeClient(fetchImpl)
    const pending = client.request<{ ok: boolean }>({ path: "/account" })

    await vi.advanceTimersByTimeAsync(999)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    const { data } = await pending

    expect(data).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
})
