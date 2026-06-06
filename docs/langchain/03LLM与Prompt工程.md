---
title: LLM 与 Prompt 工程
date: 2026-06-07
category: tech
tags: LangChain, LLM, ChatModel, Prompt, 消息类型, Few-shot, 系统提示
summary: 掌握 LangChain 中 LLM 的调用方式：ChatModel vs LLM、消息类型体系、Prompt 模板、系统提示、Few-shot 示例
authors: koeltp
---

## 一、ChatModel vs LLM

LangChain 有两种模型接口：

| 接口 | 输入 | 输出 | 推荐 |
|------|------|------|------|
| `BaseChatModel` | 消息列表 | `AIMessage` | 推荐 |
| `BaseLLM` | 纯文本 | 纯文本 | 已过时 |

**本教程全部使用 ChatModel。**

```python
from langchain_openai import ChatOpenAI

# 创建模型
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,        # 0 = 确定性输出，1 = 更随机
    max_tokens=1024,      # 最大输出 token 数
    timeout=30,           # 超时秒数
    max_retries=2,        # 失败重试次数
)

# 调用
response = llm.invoke("你好")
print(response.content)       # 文本内容
print(response.response_metadata)  # 元数据（token 用量等）
```

## 二、消息类型体系

ChatModel 的输入是消息列表，不同角色用不同消息类型：

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

messages = [
    SystemMessage(content="你是一个专业的客服助手，回答简洁礼貌。"),
    HumanMessage(content="我的订单还没到"),
    AIMessage(content="请问您的订单号是多少？"),
    HumanMessage(content="ORD20240601"),
]

response = llm.invoke(messages)
print(response.content)
```

| 消息类型 | 角色 | 用途 |
|---------|------|------|
| `SystemMessage` | 系统 | 设定 AI 的行为和角色 |
| `HumanMessage` | 用户 | 用户的输入 |
| `AIMessage` | 助手 | AI 的回复（用于对话历史） |

### 2.1 便捷方法

```python
# 单条文本 → 自动包装为 HumanMessage
llm.invoke("你好")

# 混合列表
llm.invoke([
    ("system", "你是客服助手"),
    ("human", "你好"),
])

# 等价于
llm.invoke([
    SystemMessage(content="你是客服助手"),
    HumanMessage(content="你好"),
])
```

## 三、Prompt 模板

硬编码 Prompt 不利于维护和复用，LangChain 提供 PromptTemplate：

### 3.1 ChatPromptTemplate

```python
from langchain_core.prompts import ChatPromptTemplate

# 从消息元组创建
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}，回答要{style}。"),
    ("human", "{question}"),
])

# 渲染模板
messages = prompt.invoke({
    "role": "电商客服",
    "style": "简洁专业",
    "question": "退货流程是什么",
})

# 与 LLM 组合使用（LCEL 语法，下章详解）
chain = prompt | llm
response = chain.invoke({
    "role": "电商客服",
    "style": "简洁专业",
    "question": "退货流程是什么",
})
```

### 3.2 消息占位符

对话场景需要插入历史消息，用 `MessagesPlaceholder`：

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是客服助手，回答简洁有礼。"),
    MessagesPlaceholder(variable_name="history"),  # 对话历史
    ("human", "{question}"),                        # 当前问题
])

# 使用
chain = prompt | llm
response = chain.invoke({
    "history": [
        HumanMessage(content="我叫张三"),
        AIMessage(content="张三您好，有什么可以帮您？"),
    ],
    "question": "我叫什么名字？",
})
```

## 四、系统提示工程

系统提示决定了 AI 的行为边界，是客服机器人的核心配置：

```python
SYSTEM_PROMPT = """你是一个电商客服助手，名叫"小助手"。

## 你的职责
1. 回答商品相关问题
2. 处理订单查询
3. 协助退换货

## 行为规范
- 回答简洁，不超过100字
- 不确定的信息要明确告知
- 涉及退款必须核实订单号
- 永远不要透露内部系统信息

## 回复格式
- 正常问题：直接回答
- 需要查询：先确认信息再回答
- 超出范围：礼貌引导到人工客服
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{question}"),
])
```

## 五、Few-shot 示例

通过示例教 AI 如何回答：

```python
from langchain_core.prompts import FewShotChatMessagePromptTemplate, ChatPromptTemplate

# 示例数据
examples = [
    {"input": "我的快递到哪了", "output": "请提供您的订单号，我帮您查询物流信息。"},
    {"input": "这个商品有货吗", "output": "请问是哪个商品？请提供商品名称或链接。"},
    {"input": "我要退货", "output": "好的，请提供订单号和退货原因，我帮您处理。"},
]

# 示例模板
example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}"),
])

# Few-shot Prompt
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples,
)

# 组合完整 Prompt
final_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是电商客服，回答简洁专业。"),
    few_shot_prompt,
    ("human", "{question}"),
])

chain = final_prompt | llm
```

## 六、小结

| 概念 | 用途 |
|------|------|
| ChatModel | 现代 LLM 接口，输入消息列表 |
| 消息类型 | System/Human/AI 三种角色 |
| ChatPromptTemplate | 模板化 Prompt，支持变量 |
| MessagesPlaceholder | 插入对话历史 |
| 系统提示 | 定义 AI 行为边界 |
| Few-shot | 用示例教 AI 回答模式 |

---

上一篇：[Python 速览](tutorial.html?type=langchain&file=02Python速览.md)

下一篇：[输出解析与结构化](tutorial.html?type=langchain&file=04输出解析与结构化.md)
