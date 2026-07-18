---
layout: default
title: Python
parent: Integrations
nav_order: 3
---

# Python

HoodCompute works with the standard OpenAI Python SDK. For additional functionality like structured receipt access and async streaming, you can also use `httpx` directly.

---

## Using the OpenAI Python SDK

```bash
pip install openai
```

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.hoodcompute.com/v1",
    api_key=os.environ["HOODCOMPUTE_API_KEY"]
)

# Non-streaming
response = client.chat.completions.create(
    model="qwen3-8b",
    messages=[
        {"role": "system", "content": "You are a precise technical assistant."},
        {"role": "user", "content": "Explain how the EVM executes smart contract bytecode."}
    ],
    max_tokens=512,
    temperature=0.3
)

print(response.choices[0].message.content)
print(f"Tokens used: {response.usage.total_tokens}")
```

### Streaming

```python
stream = client.chat.completions.create(
    model="llama-3.3-70b",
    messages=[{"role": "user", "content": "Write a Python function to parse JSON safely."}],
    stream=True
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)

print()
```

### Async

```python
import asyncio
from openai import AsyncOpenAI

async def main():
    client = AsyncOpenAI(
        base_url="https://api.hoodcompute.com/v1",
        api_key=os.environ["HOODCOMPUTE_API_KEY"]
    )

    async with client.chat.completions.stream(
        model="qwen3-8b",
        messages=[{"role": "user", "content": "What is a Merkle tree?"}]
    ) as stream:
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                print(delta, end="", flush=True)

asyncio.run(main())
```

---

## Accessing on-chain headers with httpx

The OpenAI SDK does not expose response headers. Use `httpx` directly when you need the on-chain transaction hashes.

```python
import os
import httpx

API_KEY = os.environ["HOODCOMPUTE_API_KEY"]
BASE_URL = "https://api.hoodcompute.com/v1"

def chat(messages: list, model: str = "qwen3-8b") -> dict:
    response = httpx.post(
        f"{BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={"model": model, "messages": messages},
        timeout=120
    )
    response.raise_for_status()

    data = response.json()
    data["_hoodcompute"] = {
        "job_id": response.headers.get("x-hoodcompute-job-id"),
        "escrow_tx": response.headers.get("x-hoodcompute-tx-hash"),
        "settlement_tx": response.headers.get("x-hoodcompute-settlement-tx"),
        "worker": response.headers.get("x-hoodcompute-worker"),
        "credits_remaining": response.headers.get("x-hoodcompute-credits-remaining")
    }
    return data

result = chat([{"role": "user", "content": "What is ERC-4337 account abstraction?"}])
content = result["choices"][0]["message"]["content"]
job_id = result["_hoodcompute"]["job_id"]
settlement = result["_hoodcompute"]["settlement_tx"]

print(content)
print(f"\nVerify payment: https://robinhoodchain.blockscout.com/tx/{settlement}")
```

---

## Streaming with httpx

```python
import json
import httpx

def stream_chat(messages: list, model: str = "qwen3-8b"):
    with httpx.stream(
        "POST",
        f"{BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={"model": model, "messages": messages, "stream": True},
        timeout=120
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if not line or line == "data: [DONE]":
                continue
            if line.startswith("data: "):
                chunk = json.loads(line[6:])
                delta = chunk["choices"][0]["delta"].get("content", "")
                if delta:
                    print(delta, end="", flush=True)

stream_chat([{"role": "user", "content": "What is WebGPU?"}])
```

---

## Multi-turn conversations

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.hoodcompute.com/v1",
    api_key=os.environ["HOODCOMPUTE_API_KEY"]
)

messages = [{"role": "system", "content": "You are a knowledgeable assistant."}]

while True:
    user_input = input("You: ").strip()
    if not user_input:
        break

    messages.append({"role": "user", "content": user_input})

    response = client.chat.completions.create(
        model="qwen3-8b",
        messages=messages
    )

    assistant_message = response.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_message})

    print(f"Assistant: {assistant_message}")
```

---

## Error handling

```python
from openai import OpenAI, APIStatusError, APIConnectionError
import time

client = OpenAI(
    base_url="https://api.hoodcompute.com/v1",
    api_key=os.environ["HOODCOMPUTE_API_KEY"]
)

def chat_with_retry(messages: list, model: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages
            )
            return response.choices[0].message.content

        except APIStatusError as e:
            if e.status_code == 402:
                raise Exception("Insufficient credits. Top up at hoodcompute.com/app") from e

            if e.status_code == 503:
                retry_after = e.response.json().get("error", {}).get("details", {}).get("retry_after", 10)
                if attempt < max_retries - 1:
                    time.sleep(retry_after)
                    continue
                raise

            if e.status_code == 504:
                # Job timed out, credits were refunded
                if attempt < max_retries - 1:
                    time.sleep(5)
                    continue
                raise

            raise

        except APIConnectionError as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise

    raise Exception(f"Failed after {max_retries} attempts")
```

---

## Checking account balance

```python
import httpx

def get_balance() -> dict:
    response = httpx.get(
        "https://api.hoodcompute.com/v1/account",
        headers={"Authorization": f"Bearer {os.environ['HOODCOMPUTE_API_KEY']}"}
    )
    response.raise_for_status()
    return response.json()

balance = get_balance()
print(f"Credits remaining: {balance['credits_remaining']} (${balance['usdg_value']:.2f})")
```
