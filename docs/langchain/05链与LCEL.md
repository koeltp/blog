---
title: 链与 LCEL
date: 2026-06-07
category: tech
tags: LangChain, LCEL, Runnable, Chain, 管道, 流式输出, 并行
summary: 掌握 LangChain 核心语法 LCEL：Runnable 管道操作、invoke/stream/batch 调用方式、链的组合、调试技巧
authors: koeltp
---

## 一、LCEL 是什么

LCEL（LangChain Expression Language）是 LangChain 的核心语法，用管道符 `|` 组合组件：

```python
chain = prompt | llm | parser
```

等价于：把 prompt 的输出喂给 llm，把 llm 的输出喂给 parser。

```mermaid
flowchart LR
    A["prompt.invoke()"] -->|"消息列表"| B["llm.invoke()"]
    B -->|"AIMessage"| C["parser.invoke()"]
    C -->|"Pydantic 对象"| D[结果]
```

## 二、Runnable 接口

所有 LCEL 组件都实现 `Runnable` 接口，提供统一的调用方式：

| 方法 | 同步 | 异步 | 用途 |
|------|------|------|------|
| 单次调用 | `invoke()` | `ainvoke()` | 处理单个输入 |
| 流式输出 | `stream()` | `astream()` | 逐 token 输出 |
| 批量调用 | `batch()` | `abatch()` | 并行处理多个输入 |
| 流式事件 | — | `astream_events()` | 获取中间步骤事件 |

```python
# invoke — 单次调用
result = chain.invoke({"question": "你好"})

# stream — 流式输出
for chunk in chain.stream({"question": "写一首诗"}):
    print(chunk.content, end="", flush=True)

# batch — 批量调用
results = chain.batch([
    {"question": "问题1"},
    {"question": "问题2"},
])

# astream_events — 获取详细事件（调试用）
async for event in chain.astream_events({"question": "你好"}, version="v2"):
    print(event["event"], event.get("data", {}))
```

## 三、管道组合

### 3.1 基本组合

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是客服助手，回答简洁。"),
    ("human", "{question}"),
])
parser = StrOutputParser()  # 提取 AIMessage 的 content 字段

chain = prompt | llm | parser

# 调用
answer = chain.invoke({"question": "退货流程是什么"})
print(answer)  # 纯文本字符串
```

### 3.2 多步骤链

```python
# 意图识别 → 路由 → 回复
intent_chain = intent_prompt | llm | intent_parser
response_chain = response_prompt | llm | StrOutputParser()

# 先识别意图，再生成回复
def route_by_intent(inputs: dict) -> dict:
    intent = intent_chain.invoke(inputs)
    return {**inputs, "intent": intent.intent, "entities": intent.entities}

full_chain = route_by_intent | response_chain
```

### 3.3 RunnablePassthrough

传递输入，不做变换：

```python
from langchain_core.runnables import RunnablePassthrough

# 同时保留原始输入和 LLM 输出
chain = RunnablePassthrough.assign(
    answer=prompt | llm | StrOutputParser()
)

result = chain.invoke({"question": "你好"})
# result = {"question": "你好", "answer": "你好！有什么可以帮您？"}
```

### 3.4 RunnableParallel

并行执行多个链：

```python
from langchain_core.runnables import RunnableParallel

# 同时识别意图和提取实体
parallel = RunnableParallel(
    intent=intent_prompt | llm | intent_parser,
    sentiment=sentiment_prompt | llm | sentiment_parser,
)

result = parallel.invoke({"question": "我的快递怎么还没到"})
# result = {"intent": Intent.ORDER_QUERY, "sentiment": Sentiment.NEGATIVE}
```

## 四、RunnableLambda

用自定义函数处理数据：

```python
from langchain_core.runnables import RunnableLambda

def format_response(output: dict) -> str:
    """格式化回复"""
    intent = output["intent"]
    answer = output["answer"]
    return f"[{intent}] {answer}"

chain = (
    RunnablePassthrough.assign(
        intent=intent_prompt | llm | intent_parser,
        answer=response_prompt | llm | StrOutputParser(),
    )
    | RunnableLambda(format_response)
)
```

## 五、配置与回调

### 5.1 运行时配置

```python
# 通过 config 传递运行时参数
chain = prompt | llm | parser

result = chain.invoke(
    {"question": "你好"},
    config={
        "run_name": "客服对话",
        "max_concurrency": 5,
        "metadata": {"user_id": "user_001"},
    }
)
```

### 5.2 with_fallbacks

主模型失败时自动切换备用模型：

```python
primary = ChatOpenAI(model="gpt-4o")
fallback = ChatOpenAI(model="gpt-4o-mini")

chain = prompt | primary.with_fallbacks([fallback]) | parser
```

### 5.3 with_retry

自动重试：

```python
chain = (prompt | llm | parser).with_retry(
    stop_after_attempt=3,
    retry_if_exception_type=(ValueError,),
)
```

## 六、调试技巧

```python
# 方法1：打印中间结果
debug_chain = (
    prompt
    | RunnableLambda(lambda x: (print("Prompt输出:", x), x)[1])
    | llm
    | RunnableLambda(lambda x: (print("LLM输出:", x.content), x)[1])
    | parser
)

# 方法2：使用 LangSmith（推荐）
# 设置环境变量即可自动追踪
# LANGSMITH_API_KEY=xxx
# LANGSMITH_PROJECT=customer-service-bot
# LANGCHAIN_TRACING_V2=true
```

## 七、小结

| 概念 | 用途 |
|------|------|
| `\|` 管道 | 串联组件 |
| `invoke/stream/batch` | 统一调用接口 |
| `RunnablePassthrough` | 透传输入 |
| `RunnableParallel` | 并行执行 |
| `RunnableLambda` | 自定义函数 |
| `with_fallbacks` | 备用模型 |
| `with_retry` | 自动重试 |

---

上一篇：[输出解析与结构化](tutorial.html?type=langchain&file=04输出解析与结构化.md)

下一篇：[对话记忆](tutorial.html?type=langchain&file=06对话记忆.md)
