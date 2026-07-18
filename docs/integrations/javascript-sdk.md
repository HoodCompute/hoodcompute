---
layout: default
title: JavaScript and TypeScript SDK
parent: Integrations
nav_order: 2
---

# JavaScript and TypeScript SDK

The `@hoodcompute/sdk` package provides typed access to the HoodCompute API with wallet-native authentication, structured streaming, React hooks, and on-chain receipt retrieval.

---

## Installation

```bash
npm install @hoodcompute/sdk
# or
pnpm add @hoodcompute/sdk
# or
yarn add @hoodcompute/sdk
```

---

## Basic usage

```typescript
import { HoodComputeClient } from "@hoodcompute/sdk"

const client = new HoodComputeClient({
    apiKey: process.env.HOODCOMPUTE_API_KEY
})

// Non-streaming chat
const response = await client.chat.completions.create({
    model: "qwen3-8b",
    messages: [{ role: "user", content: "What is WebGPU?" }]
})

console.log(response.choices[0].message.content)
console.log("Job ID:", response.jobId)
console.log("Settlement tx:", response.settlementTx)
```

---

## Streaming

```typescript
const stream = await client.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [{ role: "user", content: "Explain how optimistic rollups work." }],
    stream: true
})

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
}

// After the stream ends, the receipt is available
const receipt = stream.receipt
console.log("Settlement:", receipt.settlementTx)
console.log("Worker:", receipt.workerAddress)
console.log("Credits used:", receipt.creditsCharged)
```

---

## On-chain receipts

Every completed job has an on-chain receipt. Retrieve it from the stream object after completion, or fetch it later by job ID.

```typescript
// From a completed stream
const receipt = stream.receipt
// {
//   jobId: "job_8fx2kp3m...",
//   model: "llama-3.3-70b",
//   tier: "max",
//   creditsCharged: 40,
//   usdgValue: 0.40,
//   workerAddress: "0x9e2d5b7a814cf3068d91e4a2b5c60f7d83a41c9e",
//   escrowTx: "0x4b8e2f7c9a1d6053e8b24f9c7a30d1e5f6829c4b7d0a3e8f1c5b9d2a6e470381",
//   settlementTx: "0xd3a91c5e7f2b8064a1c9e5d27b483f0a6e1c8b5d9f2a7043e6b1d8c4a95f7e20",
//   blockNumber: 3218472,
//   proofHash: "sha256:a1b2c3d4..."
// }

// Fetch any job's receipt by ID
const job = await client.jobs.get("job_8fx2kp3m9qrstvwxyz")
console.log(job.onChain.settlementTx)

// Link directly to the Blockscout explorer
const explorerUrl = `https://robinhoodchain.blockscout.com/tx/${job.onChain.settlementTx}`
```

---

## React hooks

Import from `@hoodcompute/sdk/react`.

```typescript
import { useHoodComputeChat } from "@hoodcompute/sdk/react"

function ChatComponent() {
    const { send, messages, status, balance, lastReceipt } = useHoodComputeChat({
        model: "qwen3-8b",
        apiKey: process.env.NEXT_PUBLIC_HOODCOMPUTE_API_KEY
    })

    const handleSend = async (text: string) => {
        await send(text)
    }

    return (
        <div>
            <p>Credits remaining: {balance?.creditsRemaining}</p>
            <p>Status: {status}</p>

            {messages.map((msg, i) => (
                <div key={i}>
                    <strong>{msg.role}:</strong> {msg.content}
                </div>
            ))}

            {lastReceipt && (
                <p>
                    Last job settled:{" "}
                    <a href={`https://robinhoodchain.blockscout.com/tx/${lastReceipt.settlementTx}`}>
                        View on Blockscout
                    </a>
                </p>
            )}
        </div>
    )
}
```

### Hook API

```typescript
const {
    send,           // (message: string) => Promise<void>
    messages,       // Array<{ role: string; content: string }>
    status,         // "idle" | "streaming" | "settling" | "error"
    balance,        // { creditsRemaining: number; usdgValue: number } | null
    lastReceipt,    // JobReceipt | null
    error,          // Error | null
    reset           // () => void, clears the conversation
} = useHoodComputeChat({
    model: "qwen3-8b",
    apiKey: "hoodc_live_...",
    systemPrompt: "You are a helpful assistant.",  // optional
    onComplete: (receipt) => { ... },              // optional callback
    onError: (error) => { ... }                    // optional callback
})
```

---

## Account and credits

```typescript
const account = await client.account.get()
// {
//   wallet: "0x7c41f9b8d2a6e3054cf18a9b62d47e0c93f5a1b8",
//   creditsRemaining: 1420,
//   usdgValue: 14.20,
//   lastTopupAt: Date
// }

// List recent jobs
const jobs = await client.jobs.list({ limit: 10, status: "settled" })
for (const job of jobs.data) {
    console.log(`${job.id}: ${job.model} - ${job.creditsCharged} credits`)
}
```

---

## Webhooks

```typescript
import { verifyWebhookSignature, type HoodComputeWebhookEvent } from "@hoodcompute/sdk"

// Verify and parse a webhook in an Express handler
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
    const signature = req.headers["hoodcompute-signature"] as string
    const isValid = verifyWebhookSignature(
        req.body.toString(),
        signature,
        process.env.WEBHOOK_SECRET!
    )

    if (!isValid) {
        return res.status(400).json({ error: "Invalid signature" })
    }

    const event: HoodComputeWebhookEvent = JSON.parse(req.body.toString())

    switch (event.event) {
        case "job.completed":
            console.log("Job settled:", event.data.settlementTx)
            break
        case "credit.low":
            console.log("Credits low:", event.data.creditsRemaining)
            break
    }

    res.json({ received: true })
})
```

---

## Client configuration

```typescript
const client = new HoodComputeClient({
    apiKey: "hoodc_live_...",       // required
    baseURL: "https://api.hoodcompute.com/v1",  // default, override for testing
    timeout: 180_000,                 // request timeout in ms (default: 120000)
    maxRetries: 3,                    // auto-retry on 5xx and 503 (default: 2)
    defaultHeaders: {                 // added to every request
        "x-app-version": "1.0.0"
    }
})
```

---

## TypeScript types

Key types exported from `@hoodcompute/sdk`:

```typescript
import type {
    ChatCompletion,
    ChatCompletionChunk,
    ChatCompletionCreateParams,
    JobReceipt,
    Job,
    Account,
    Model,
    HoodComputeModel,       // extends Model with tier, workers, latency
    WebhookEvent,
    JobCompletedEvent,
    CreditLowEvent
} from "@hoodcompute/sdk"
```
