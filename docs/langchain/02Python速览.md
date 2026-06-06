---
title: Python 速览
date: 2026-06-07
category: tech
tags: LangChain, Python, 类型提示, 装饰器, 异步, Pydantic
summary: 快速回顾 Python 核心语法：类型提示、数据类、装饰器、异步编程、Pydantic 模型——LangChain 开发必备的 Python 知识
authors: koeltp
---

## 一、为什么需要这篇

LangChain 大量使用 Python 的高级特性：类型提示、Pydantic 模型、装饰器、异步。如果你已经熟悉 Python，可以跳过；如果有些生疏，这篇帮你快速回忆。

## 二、类型提示

LangChain 的 API 几乎都有类型标注，理解类型提示是读懂源码的基础：

```python
# 基本类型
name: str = "客服机器人"
version: float = 1.0
is_active: bool = True

# 容器类型
messages: list[str] = ["你好", "请问有什么可以帮您"]
config: dict[str, any] = {"model": "gpt-4o", "temperature": 0}

# 可选类型（可能为 None）
nickname: str | None = None

# 函数签名
def chat(query: str, history: list[str] | None = None) -> str:
    """对话函数"""
    return f"回复：{query}"
```

## 三、数据类与 Pydantic

LangChain 用 Pydantic 做数据校验和序列化，这是必须掌握的：

```python
from pydantic import BaseModel, Field

class CustomerInfo(BaseModel):
    """客户信息"""
    name: str = Field(description="客户姓名")
    phone: str = Field(pattern=r"^1[3-9]\d{9}$", description="手机号")
    vip_level: int = Field(default=0, ge=0, le=5, description="VIP等级 0-5")

# 自动校验
customer = CustomerInfo(name="张三", phone="13800138000", vip_level=3)

# 校验失败会抛异常
try:
    bad = CustomerInfo(name="李四", phone="123")  # 手机号格式不对
except ValueError as e:
    print(e)  # 显示校验错误详情

# 序列化
customer.model_dump()       # → {"name": "张三", "phone": "13800138000", "vip_level": 3}
customer.model_dump_json()  # → JSON 字符串

# 反序列化
CustomerInfo.model_validate_json('{"name":"王五","phone":"13900139000","vip_level":1}')
```

**Pydantic vs dataclass：**

| 特性 | Pydantic | dataclass |
|------|----------|-----------|
| 运行时校验 | 有 | 无 |
| JSON 序列化 | 内置 | 需手动 |
| LangChain 集成 | 原生支持 | 不支持 |
| 性能 | 快（Rust 内核） | 更快 |

**结论：LangChain 项目一律用 Pydantic。**

## 四、装饰器

LangChain 的 `@tool` 装饰器用来定义工具，理解装饰器才能用好它：

```python
# 装饰器本质：接收函数，返回新函数
def log_call(func):
    """记录函数调用"""
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}({args}, {kwargs})")
        result = func(*args, **kwargs)
        print(f"返回 {result}")
        return result
    return wrapper

@log_call
def search_order(order_id: str) -> str:
    return f"订单 {order_id} 已发货"

# 等价于 search_order = log_call(search_order)
search_order("ORD001")
# 输出：
# 调用 search_order(('ORD001',), {})
# 返回 订单 ORD001 已发货
```

LangChain 中的使用：

```python
from langchain_core.tools import tool

@tool
def search_order(order_id: str) -> str:
    """查询订单状态。参数：order_id - 订单编号"""
    # 实际业务逻辑
    return f"订单 {order_id} 已发货"
```

## 五、异步编程

LangChain 支持异步调用，高并发场景必须用异步：

```python
import asyncio
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

# 同步调用
response = llm.invoke("你好")

# 异步调用
async def chat():
    response = await llm.ainvoke("你好")
    print(response.content)

# 批量异步
async def batch_chat():
    responses = await llm.abatch(["问题1", "问题2", "问题3"])
    for r in responses:
        print(r.content)

# 流式输出
async def stream_chat():
    async for chunk in llm.astream("写一首诗"):
        print(chunk.content, end="", flush=True)

# 运行异步函数
asyncio.run(chat())
```

## 六、上下文管理器

LangChain 的回调系统用上下文管理器管理：

```python
# 自定义上下文管理器
class Timer:
    def __enter__(self):
        import time
        self.start = time.time()
        return self

    def __exit__(self, *args):
        import time
        print(f"耗时：{time.time() - self.start:.2f}s")

with Timer():
    llm.invoke("复杂问题")
```

## 七、小结

| 特性 | LangChain 中的用途 |
|------|-------------------|
| 类型提示 | API 签名、Pydantic 模型 |
| Pydantic | 数据校验、结构化输出、工具参数 |
| 装饰器 | @tool 定义工具 |
| 异步 | ainvoke/astream/abatch |
| 上下文管理器 | 回调、追踪 |

---

上一篇：[概述与环境搭建](tutorial.html?type=langchain&file=01概述与环境搭建.md)

下一篇：[LLM 与 Prompt 工程](tutorial.html?type=langchain&file=03LLM与Prompt工程.md)
