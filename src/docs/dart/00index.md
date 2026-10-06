---
layout: TutorialLayout
title: Dart教程
date: 2026-06-08
category: tech
tags: Dart, Flutter, 编程语言
summary: 从零开始系统学习 Dart 语言：基础语法、类型系统、面向对象、异步编程、集合与泛型，为 Flutter 开发打下坚实基础
authors: koeltp
---

# Dart 教程

Dart 是 Google 开发的一门现代化编程语言，是 Flutter 应用的官方开发语言。它兼具静态类型的安全性和动态语言的灵活性，语法简洁优雅，特别适合构建跨平台应用。

## 为什么要学 Dart？

- **Flutter 的基石** — Dart 是 Flutter 唯一官方语言，学 Dart 是写 Flutter 的前提
- **语法友好** — 如果你熟悉 Java、JavaScript 或 C#，Dart 上手极快
- **全栈能力** — 前端 Flutter、后端 Shelf/Aqueduct、脚本工具，一套语言搞定
- **强类型 + 空安全** — 编译期捕获错误，代码更可靠

## 教程目录

| 章节 | 内容 | 实战项目 |
|------|------|---------|
| [01 环境搭建与第一个程序](./01环境搭建与第一个程序.html) | SDK 安装、开发工具、Hello World | 创建项目骨架 |
| [02 变量、常量与类型系统](./02变量常量与类型系统.html) | var/final/const、内置类型、类型转换 | 定义 Todo 数据模型 |
| [03 运算符与控制流](./03运算符与控制流.html) | 算术/关系/逻辑运算符、if/switch/for/while | 实现命令解析 |
| [04 函数与闭包](./04函数与闭包.html) | 参数模式、箭头函数、匿名函数、闭包 | 重构为函数式架构 |
| [05 集合与泛型](./05集合与泛型.html) | List/Set/Map、泛型约束、集合操作方法 | 用集合管理 Todo 列表 |
| [06 类与面向对象](./06类与面向对象.html) | 构造函数、继承、抽象类、Mixin | 封装 TodoRepository 类 |
| [07 异步编程](./07异步编程.html) | Future、async/await、Stream、事件循环 | 异步读写文件持久化 |
| [08 空安全](./08空安全.html) | 可空类型、空检查、late、! 操作符 | 空安全改造整个项目 |
| [09 异常与错误处理](./09异常与错误处理.html) | try/catch/finally、自定义异常 | 健壮的错误处理 |
| [10 库与包管理](./10库与包管理.html) | import/export、pub.dev、pubspec.yaml | 拆分为多文件项目 |
| [11 Dart 3 新特性](./11Dart3新特性.html) | Records、Pattern Matching、Sealed Class | 用新特性重构项目 |

## 实战项目：CLI Todo 应用

本教程以一个**命令行 Todo 应用**贯穿始终，每学一个知识点就给项目加一层能力：

```
第1章 → 创建项目，跑通 Hello World
第2章 → 定义 Todo 数据模型（变量、类型）
第3章 → 实现命令解析（运算符、控制流）
第4章 → 重构为函数式架构（函数、闭包）
第5章 → 用集合管理 Todo 列表（List、Map）
第6章 → 封装 TodoRepository 类（面向对象）
第7章 → 异步读写文件持久化（Future、async）
第8章 → 空安全改造（?、??、late）
第9章 → 健壮的错误处理（try/catch、自定义异常）
第10章 → 拆分为多文件项目（import/export）
第11章 → 用 Dart 3 新特性重构（Records、Pattern Matching）
```

## 学习建议

1. **边学边练** — 每章的代码示例都在 [DartPad](https://dartpad.dev/) 中直接运行
2. **跟着做项目** — 每章有实战环节，跟着做才能真正掌握
3. **完成练习题** — 每章末尾有 3-5 道练习，检测学习效果
4. **重点攻克异步** — Future/Stream 是 Dart 的核心，也是 Flutter 开发的基础
5. **理解空安全** — Dart 的空安全是强制的，理解它才能写出正确的代码
