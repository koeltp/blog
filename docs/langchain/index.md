---
title: LangChain 从菜鸟到高手
summary: 一份系统化的 LangChain 教程，从环境搭建到生产部署，以 Python 为主线，构建 AI 客服机器人
authors: koeltp
date: 2026-06-07
category: tech
tags: LangChain, LLM, AI应用, Python, RAG, Agent
---

# LangChain 从菜鸟到高手

> 作者：koeltp

一份系统化的 LangChain 教程，从环境搭建到生产部署，以 Python 为主线，构建 AI 客服机器人。教程假设读者有基本编程能力，快速过 Python 基础，重点深入 LLM 应用开发。

## 基础篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 01 | [概述与环境搭建](tutorial.html?type=langchain&file=01概述与环境搭建.md) | LangChain 定位、生态、安装、第一个程序 |
| 02 | [Python 速览](tutorial.html?type=langchain&file=02Python速览.md) | 类型提示、Pydantic、装饰器、异步 |
| 03 | [LLM 与 Prompt 工程](tutorial.html?type=langchain&file=03LLM与Prompt工程.md) | ChatModel、消息类型、Prompt 模板、Few-shot |
| 04 | [输出解析与结构化](tutorial.html?type=langchain&file=04输出解析与结构化.md) | with_structured_output、PydanticOutputParser |
| 05 | [链与 LCEL](tutorial.html?type=langchain&file=05链与LCEL.md) | LCEL 管道语法、Runnable 接口、链组合 |

## 进阶篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 06 | [对话记忆](tutorial.html?type=langchain&file=06对话记忆.md) | 消息历史、窗口记忆、摘要记忆、持久化 |
| 07 | [文档加载与分割](tutorial.html?type=langchain&file=07文档加载与分割.md) | Document Loader、Text Splitter、分块策略 |
| 08 | [向量存储与检索](tutorial.html?type=langchain&file=08向量存储与检索.md) | Embedding、Chroma/FAISS、相似度搜索 |
| 09 | [RAG 检索增强生成](tutorial.html?type=langchain&file=09RAG检索增强生成.md) | 完整 RAG 流程、重排序、来源引用 |

## 高级篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 10 | [Agent 与工具调用](tutorial.html?type=langchain&file=10Agent与工具调用.md) | ReAct Agent、Tool 定义、AgentExecutor |
| 11 | [自定义工具与多 Agent](tutorial.html?type=langchain&file=11自定义工具与多Agent.md) | 外部 API 集成、LangGraph 多 Agent 协作 |
| 12 | [对话系统实战](tutorial.html?type=langchain&file=12对话系统实战.md) | 完整客服机器人：RAG + 记忆 + Agent + 流式输出 |
| 13 | [评估与测试](tutorial.html?type=langchain&file=13评估与测试.md) | LangSmith 追踪、评估框架、幻觉检测 |
| 14 | [部署与生产化](tutorial.html?type=langchain&file=14部署与生产化.md) | LangServe、FastAPI、Docker、监控告警 |

## 贯穿示例

教程全程使用 **AI 客服机器人** 作为示例项目：

- 01-05：搭建基础对话能力
- 06-09：加入记忆和知识库
- 10-11：集成工具和多 Agent
- 12：完整系统实战
- 13-14：评估、测试、部署
