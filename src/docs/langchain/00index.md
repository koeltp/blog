---
layout: TutorialLayout
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
| 01 | [概述与环境搭建](/docs/langchain/01概述与环境搭建.html) | LangChain 定位、生态、安装、第一个程序 |
| 02 | [Python 速览](/docs/langchain/02Python速览.html) | 类型提示、Pydantic、装饰器、异步 |
| 03 | [LLM 与 Prompt 工程](/docs/langchain/03LLM与Prompt工程.html) | ChatModel、消息类型、Prompt 模板、Few-shot |
| 04 | [输出解析与结构化](/docs/langchain/04输出解析与结构化.html) | with_structured_output、PydanticOutputParser |
| 05 | [链与 LCEL](/docs/langchain/05链与LCEL.html) | LCEL 管道语法、Runnable 接口、链组合 |

## 进阶篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 06 | [对话记忆](/docs/langchain/06对话记忆.html) | 消息历史、窗口记忆、摘要记忆、持久化 |
| 07 | [文档加载与分割](/docs/langchain/07文档加载与分割.html) | Document Loader、Text Splitter、分块策略 |
| 08 | [向量存储与检索](/docs/langchain/08向量存储与检索.html) | Embedding、Chroma/FAISS、相似度搜索 |
| 09 | [RAG 检索增强生成](/docs/langchain/09RAG检索增强生成.html) | 完整 RAG 流程、重排序、来源引用 |

## 高级篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 10 | [Agent 与工具调用](/docs/langchain/10Agent与工具调用.html) | ReAct Agent、Tool 定义、AgentExecutor |
| 11 | [自定义工具与多 Agent](/docs/langchain/11自定义工具与多Agent.html) | 外部 API 集成、LangGraph 多 Agent 协作 |
| 12 | [对话系统实战](/docs/langchain/12对话系统实战.html) | 完整客服机器人：RAG + 记忆 + Agent + 流式输出 |
| 13 | [评估与测试](/docs/langchain/13评估与测试.html) | LangSmith 追踪、评估框架、幻觉检测 |
| 14 | [部署与生产化](/docs/langchain/14部署与生产化.html) | LangServe、FastAPI、Docker、监控告警 |

## 贯穿示例

教程全程使用 **AI 客服机器人** 作为示例项目：

- 01-05：搭建基础对话能力
- 06-09：加入记忆和知识库
- 10-11：集成工具和多 Agent
- 12：完整系统实战
- 13-14：评估、测试、部署
