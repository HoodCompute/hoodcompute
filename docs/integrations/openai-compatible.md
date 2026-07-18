---
layout: default
title: OpenAI-Compatible Usage
parent: Integrations
nav_order: 1
---

# OpenAI-Compatible Usage

The HoodCompute API accepts the same request shape as the OpenAI API and returns the same response shape. If you are already using the OpenAI SDK in Python, TypeScript, or any other language, you can point it at HoodCompute by changing the base URL and API key.

---

## What is compatible

| Feature | Compatible |
|---|---|
| `POST /v1/chat/completions` | Yes, including streaming |
| `GET /v1/models` | Yes, with additional `hoodcompute` fields |
| Streaming (SSE) | Yes |
| `max_tokens`, `temperature`, `top_p` | Yes |
| `stop` sequences | Yes |
| `frequency_penalty`, `presence_penalty` | Yes |
| System and multi-turn messages | Yes |
| Tool / function calling | Coming in Phase 2 |
| Embeddings (`/v1/embeddings`) | Coming in Phase 2 |
| Image inputs (`vision`) | Coming in Phase 2 |
| Assistants API | No |
| Fine-tuning API | No |

---

## Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.hoodcompute.com/v1",
    api_key="hoodc_live_your_key_here"
)

# Non-streaming
response = client.chat.completions.create(
    model="qwen3-8b",
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {"role": "user", "content": "What is llama.cpp?"}
    ]
)
print(response.choices[0].message.content)

# Streaming
stream = client.chat.completions.create(
    model="llama-3.3-70b",
    messages=[{"role": "user", "content": "Explain zero-knowledge proofs."}],
    stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

---

## TypeScript / Node.js (OpenAI SDK)

```typescript
import OpenAI from "openai"

const client = new OpenAI({
    baseURL: "https://api.hoodcompute.com/v1",
    apiKey: "hoodc_live_your_key_here"
})

// Non-streaming
const response = await client.chat.completions.create({
    model: "qwen3-8b",
    messages: [
        { role: "system", content: "You are a concise assistant." },
        { role: "user", content: "What is llama.cpp?" }
    ]
})
console.log(response.choices[0].message.content)

// Streaming
const stream = await client.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [{ role: "user", content: "Explain zero-knowledge proofs." }],
    stream: true
})

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
}
```

---

## Environment variable setup

Use an environment variable for your API key. Never hardcode it.

```bash
export HOODCOMPUTE_API_KEY="hoodc_live_your_key_here"
```

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.hoodcompute.com/v1",
    api_key=os.environ["HOODCOMPUTE_API_KEY"]
)
```

```typescript
const client = new OpenAI({
    baseURL: "https://api.hoodcompute.com/v1",
    apiKey: process.env.HOODCOMPUTE_API_KEY!
})
```

---

## Accessing on-chain receipt data

The HoodCompute API adds extra response headers that the OpenAI SDK does not surface by default. If you need the on-chain transaction hashes for verification, you can access them by inspecting the raw HTTP response.

```python
import httpx

response = httpx.post(
    "https://api.hoodcompute.com/v1/chat/completions",
    headers={"Authorization": f"Bearer {api_key}"},
    json={
        "model": "qwen3-8b",
        "messages": [{"role": "user", "content": "Hello"}]
    }
)

job_id = response.headers.get("x-hoodcompute-job-id")
settlement_tx = response.headers.get("x-hoodcompute-settlement-tx")
print(f"Job: {job_id}")
print(f"Settlement tx: https://robinhoodchain.blockscout.com/tx/{settlement_tx}")
```

If you want typed access to receipts, structured streaming, and wallet-native auth, use the [JavaScript SDK]({% link integrations/javascript-sdk.md %}) or the [Python usage guide]({% link integrations/python.md %}).

---

## Selecting a model

HoodCompute's model IDs differ from OpenAI's. Call `GET /v1/models` to see the current list. Common substitutions:

| OpenAI model | Comparable HoodCompute model | Notes |
|---|---|---|
| `gpt-4o` | `llama-3.3-70b` | Strong general reasoning |
| `gpt-4o-mini` | `qwen3-8b` | Fast, cheap, capable for most tasks |
| `gpt-3.5-turbo` | `mistral-7b` | Fastest, lowest cost |
| none | `deepseek-r1` | Long-form reasoning, math, code |

---

## Differences from the OpenAI API

**Credits instead of billing.** HoodCompute uses a prepaid credit balance rather than a monthly invoice. Credits must be funded before making API calls.

**On-chain settlement headers.** Every response includes `x-hoodcompute-job-id` and `x-hoodcompute-tx-hash` headers. These have no equivalent in the OpenAI API.

**No rate limits from a policy team.** Capacity is dynamically priced. If no workers are available for your model, you get a `503` with a `retry_after` value. There is no queue or throttling for well-behaved clients.

**Model deprecation policy.** Model IDs are stable. When a model is retired, the HoodCompute community votes it off the recommended list with advance notice. The ID remains valid until deprecated, not until a two-week warning period expires.
