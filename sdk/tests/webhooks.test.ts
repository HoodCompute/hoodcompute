import { describe, it, expect } from "vitest"
import crypto from "node:crypto"
import { constructWebhookEvent, verifyWebhookSignature } from "../src/webhooks"

const SECRET = "whsec_test_secret"

function sign(rawBody: string, timestamp: number, secret = SECRET): string {
  const mac = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")
  return `t=${timestamp},v1=${mac}`
}

describe("verifyWebhookSignature", () => {
  const now = 1_770_000_000
  const body = JSON.stringify({ type: "job.completed", data: { jobId: "job_1" } })

  it("accepts a correctly signed, in tolerance delivery", () => {
    const signature = sign(body, now)
    expect(verifyWebhookSignature(body, signature, SECRET, { now })).toBe(true)
  })

  it("rejects a tampered body", () => {
    const signature = sign(body, now)
    expect(verifyWebhookSignature(body + " ", signature, SECRET, { now })).toBe(false)
  })

  it("rejects a signature made with the wrong secret", () => {
    const signature = sign(body, now, "whsec_wrong")
    expect(verifyWebhookSignature(body, signature, SECRET, { now })).toBe(false)
  })

  it("rejects a missing or malformed signature header", () => {
    expect(verifyWebhookSignature(body, null, SECRET, { now })).toBe(false)
    expect(verifyWebhookSignature(body, undefined, SECRET, { now })).toBe(false)
    expect(verifyWebhookSignature(body, "not-a-signature", SECRET, { now })).toBe(false)
  })

  it("rejects a delivery outside the replay tolerance window", () => {
    const signature = sign(body, now)
    expect(verifyWebhookSignature(body, signature, SECRET, { now: now + 3600 })).toBe(false)
  })

  it("honours a disabled tolerance for old but valid signatures", () => {
    const signature = sign(body, now)
    expect(
      verifyWebhookSignature(body, signature, SECRET, { now: now + 3600, toleranceSeconds: 0 }),
    ).toBe(true)
  })
})

describe("constructWebhookEvent", () => {
  const now = 1_770_000_000
  const body = JSON.stringify({
    id: "evt_1",
    type: "job.completed",
    data: { jobId: "job_1" },
  })

  it("returns the parsed event on a valid signature", () => {
    const event = constructWebhookEvent(body, sign(body, now), SECRET, { now })
    expect(event.type).toBe("job.completed")
  })

  it("throws on an invalid signature", () => {
    expect(() => constructWebhookEvent(body, "t=1,v1=deadbeef", SECRET, { now })).toThrow(
      /signature/i,
    )
  })
})
