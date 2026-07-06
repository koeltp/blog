---
layout: TutorialLayout
title: 网络请求与API
date: 2026-06-29
category: tech
tags: Python, requests, HTTP, API, 网络请求, 速率限制
summary: 掌握 Python requests 库进行 HTTP 请求，理解 RESTful API 调用、认证、重试机制，为 LLM API 开发打下基础
authors: taipi
---

## 一、HTTP 基础

### 1.1 请求方法与状态码

```python
# HTTP 方法
GET    # 获取资源
POST   # 创建资源
PUT    # 更新资源（全量）
PATCH  # 更新资源（部分）
DELETE # 删除资源

# 常见状态码
200  # OK - 成功
201  # Created - 资源创建成功
400  # Bad Request - 请求参数错误
401  # Unauthorized - 未认证
403  # Forbidden - 禁止访问
404  # Not Found - 资源不存在
429  # Too Many Requests - 请求过于频繁
500  # Internal Server Error - 服务器内部错误
503  # Service Unavailable - 服务不可用
```

### 1.2 RESTful API 示例

```
GET    /api/users           # 获取所有用户
GET    /api/users/123       # 获取用户 123
POST   /api/users           # 创建新用户
PUT    /api/users/123       # 更新用户 123
DELETE /api/users/123       # 删除用户 123
```

## 二、requests 库

### 2.1 安装

```bash
pip install requests
```

### 2.2 GET 请求

```python
import requests

# 基本 GET
response = requests.get("https://api.github.com/users/taipi")
print(response.status_code)   # 200
print(response.headers)       # 响应头
print(response.text)          # 响应文本（str）
print(response.content)       # 响应字节（bytes）

# 解析 JSON
data = response.json()
print(data["login"])          # taipi
print(data["public_repos"])

# 带查询参数
params = {"page": 2, "per_page": 10}
response = requests.get("https://api.github.com/repos", params=params)
print(response.url)  # https://api.github.com/repos?page=2&per_page=10

# 检查错误
response.raise_for_status()  # 4xx/5xx 时抛出 HTTPError
```

### 2.3 POST 请求

```python
import requests

# 发送 JSON
payload = {
    "model": "gpt-4",
    "messages": [
        {"role": "user", "content": "你好"}
    ],
    "temperature": 0.7
}
response = requests.post(
    "https://api.openai.com/v1/chat/completions",
    json=payload,  # 自动序列化 JSON + 设置 Content-Type
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
print(response.json())

# 发送表单数据
form_data = {"username": "alice", "password": "secret"}
response = requests.post("https://example.com/login", data=form_data)

# 上传文件
with open("document.pdf", "rb") as f:
    response = requests.post(
        "https://api.example.com/upload",
        files={"file": f}
    )
```

### 2.4 会话（Session）

```python
import requests

# Session 复用连接，保持 cookie
session = requests.Session()
session.headers.update({
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
})

# 所有请求自动携带 header
response1 = session.post("https://api.example.com/data1")
response2 = session.post("https://api.example.com/data2")
response3 = session.get("https://api.example.com/result")
```

### 2.5 超时与异常处理

```python
import requests

# 始终设置超时！
response = requests.get(
    "https://api.example.com/data",
    timeout=(3.05, 10)  # (连接超时, 读取超时) 秒
)

# 异常处理
try:
    response = requests.get("https://api.example.com/data", timeout=5)
    response.raise_for_status()
except requests.exceptions.Timeout:
    print("请求超时")
except requests.exceptions.HTTPError as e:
    print(f"HTTP 错误：{e}")
except requests.exceptions.ConnectionError:
    print("连接失败")
except requests.exceptions.RequestException as e:
    print(f"请求出错：{e}")
```

## 三、调用 LLM API

### 3.1 OpenAI Chat Completions

```python
import requests
import json

def chat_with_openai(messages, model="gpt-4", api_key=None):
    """调用 OpenAI Chat API"""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000,
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    
    return data["choices"][0]["message"]["content"]

# 使用
messages = [
    {"role": "system", "content": "你是一个有帮助的助手。"},
    {"role": "user", "content": "Python 列表推导式是什么？"},
]

reply = chat_with_openai(messages, api_key="sk-xxx")
print(reply)
```

### 3.2 通用 API 客户端

```python
import requests
import time
import logging

logger = logging.getLogger(__name__)

class APIClient:
    """通用 API 客户端，带重试和速率限制"""
    
    def __init__(self, base_url, api_key, max_retries=3, rate_limit=10):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        })
        self.max_retries = max_retries
        self.rate_limit = rate_limit  # 每秒最大请求数
        self._timestamps = []
    
    def _throttle(self):
        """速率限制"""
        now = time.time()
        # 清理超过 1 秒的时间戳
        self._timestamps = [t for t in self._timestamps if now - t < 1]
        if len(self._timestamps) >= self.rate_limit:
            sleep_time = 1.0 - (now - self._timestamps[0])
            if sleep_time > 0:
                time.sleep(sleep_time)
        self._timestamps.append(time.time())
    
    def request(self, method, endpoint, **kwargs):
        """发送请求，带重试"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        for attempt in range(1, self.max_retries + 1):
            try:
                self._throttle()
                response = self.session.request(method, url, timeout=30, **kwargs)
                
                if response.status_code == 429:
                    # 速率限制，等待后重试
                    retry_after = int(response.headers.get("Retry-After", 1))
                    logger.warning(f"速率限制，等待 {retry_after}s")
                    time.sleep(retry_after)
                    continue
                
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.Timeout:
                logger.warning(f"第 {attempt} 次超时")
                if attempt == self.max_retries:
                    raise
            except requests.exceptions.HTTPError as e:
                if response.status_code >= 500:
                    logger.warning(f"第 {attempt} 次服务器错误：{e}")
                    if attempt == self.max_retries:
                        raise
                else:
                    raise
        
        return None
```

## 四、本章小结

| 概念 | 要点 |
|------|------|
| GET/POST | `requests.get/post(url, json=data)` |
| 查询参数 | `params={"key": "value"}` |
| Session | 复用连接和 header |
| 超时 | 始终设置 `timeout` |
| 异常 | `raise_for_status()` 检查 HTTP 错误 |
| LLM API | 发送 messages 列表，接收 content |

## 五、练习

1. 使用 requests 调用 GitHub API，获取某个用户的所有公开仓库

2. 编写一个函数，向 LLM API 发送请求并返回回复

3. 实现一个带重试机制的 API 客户端（3 次重试，指数退避）

4. 使用 Session 批量获取多个 API 端点的数据