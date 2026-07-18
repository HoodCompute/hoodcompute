---
layout: default
title: LangChain
parent: Integrations
nav_order: 4
---

# LangChain

HoodCompute works with LangChain via the `ChatOpenAI` class. Since the HoodCompute API is OpenAI-compatible, no additional package is required.

---

## Python (LangChain)

```bash
pip install langchain-openai
```

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

llm = ChatOpenAI(
    model="qwen3-8b",
    openai_api_base="https://api.hoodcompute.com/v1",
    openai_api_key=os.environ["HOODCOMPUTE_API_KEY"],
    temperature=0.7,
    max_tokens=1024,
    streaming=True
)

messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="Explain how optimistic rollups inherit Ethereum's security.")
]

response = llm.invoke(messages)
print(response.content)
```

### Streaming with LangChain

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(
    model="llama-3.3-70b",
    openai_api_base="https://api.hoodcompute.com/v1",
    openai_api_key=os.environ["HOODCOMPUTE_API_KEY"],
    streaming=True
)

for chunk in llm.stream([HumanMessage(content="Write a short essay on decentralization.")]):
    print(chunk.content, end="", flush=True)
```

### LangChain Expression Language (LCEL)

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(
    model="qwen3-8b",
    openai_api_base="https://api.hoodcompute.com/v1",
    openai_api_key=os.environ["HOODCOMPUTE_API_KEY"]
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a blockchain expert. Be concise."),
    ("human", "{question}")
])

chain = prompt | llm | StrOutputParser()

result = chain.invoke({"question": "What is the difference between an externally owned account and a smart contract?"})
print(result)
```

### RAG pipeline

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(
    model="llama-3.3-70b",
    openai_api_base="https://api.hoodcompute.com/v1",
    openai_api_key=os.environ["HOODCOMPUTE_API_KEY"]
)

template = """Answer the question based on the following context.

Context:
{context}

Question:
{question}
"""

prompt = ChatPromptTemplate.from_template(template)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

response = rag_chain.invoke("How does the HoodCompute settlement contract verify proofs?")
print(response)
```

---

## JavaScript / TypeScript (LangChain)

```bash
npm install @langchain/openai
```

```typescript
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

const llm = new ChatOpenAI({
    modelName: "qwen3-8b",
    configuration: {
        baseURL: "https://api.hoodcompute.com/v1",
        apiKey: process.env.HOODCOMPUTE_API_KEY
    },
    temperature: 0.7,
    streaming: true
})

const response = await llm.invoke([
    new SystemMessage("You are a concise assistant."),
    new HumanMessage("What is an ERC-4337 smart account?")
])

console.log(response.content)
```

### Streaming in TypeScript

```typescript
const stream = await llm.stream([
    new HumanMessage("Explain WebGPU and how it enables browser-based inference.")
])

for await (const chunk of stream) {
    process.stdout.write(chunk.content as string)
}
```

---

## Available models

Use the model IDs from the [Models reference]({% link api-reference/models.md %}). For LangChain's `modelName` parameter:

```python
# Python
llm = ChatOpenAI(model="llama-3.3-70b", ...)  # 70B, highest capability
llm = ChatOpenAI(model="qwen3-8b", ...)         # 8B, fast and cost-effective
llm = ChatOpenAI(model="deepseek-r1", ...)      # 70B, strong at reasoning tasks
llm = ChatOpenAI(model="mistral-7b", ...)       # 7B, lowest cost
```

---

## Notes on LangChain compatibility

**Tool calling is not yet supported.** LangChain's tool/function calling features (`bind_tools`, `with_structured_output`) will not work with HoodCompute models during the beta. Tool calling support is on the Phase 2 roadmap.

**Embeddings are not yet supported.** If your LangChain pipeline uses `OpenAIEmbeddings`, you will need to use a separate embeddings provider. HoodCompute embeddings are on the Phase 2 roadmap.

**Context window.** Each HoodCompute model has its own context window. Check the [Models reference]({% link api-reference/models.md %}) for `context_window` values. LangChain does not automatically truncate messages to fit, so manage conversation length yourself if you are building long-running chains.
