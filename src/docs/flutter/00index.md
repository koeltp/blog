---
layout: TutorialLayout
title: Flutter 从菜鸟到高手
summary: 一份系统化的 Flutter 教程，从环境搭建到应用发布，循序渐进掌握 Flutter 开发全链路
authors: koeltp
date: 2026-06-06
category: tech
tags: Flutter, 教程, Dart, 移动开发, 跨平台
---

# Flutter 从菜鸟到高手

> 作者：koeltp

一份系统化的 Flutter 教程，从环境搭建到应用发布，循序渐进掌握 Flutter 开发全链路。教程以移动端为主，Web/桌面仅在关键差异点提及。

## 基础篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 01 | [概述与环境搭建](/docs/flutter/01概述与环境搭建.html) | Flutter 是什么、环境搭建、第一个项目 |
| 02a | [Dart 语言速览（上）](/docs/flutter/02Dart语言速览（上）.html) | 类型系统、变量、函数、运算符 |
| 02b | [Dart 语言速览（下）](/docs/flutter/02Dart语言速览（下）.html) | 异步、集合、类与对象、扩展 |
| 03 | [Widget 一切皆组件](/docs/flutter/03Widget一切皆组件.html) | StatelessWidget、StatefulWidget、生命周期 |
| 04 | [布局系统](/docs/flutter/04布局系统.html) | Row、Column、Stack、Expanded、约束 |
| 05 | [路由与导航](/docs/flutter/05路由与导航.html) | Navigator 1.0、GoRouter、深链接 |

## 进阶篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 06 | [状态管理（上）](/docs/flutter/06状态管理（上）.html) | setState、InheritedWidget、Provider |
| 07 | [状态管理（下）](/docs/flutter/07状态管理（下）.html) | Riverpod（主线）、Bloc/Cubit（对照） |
| 08 | [网络请求](/docs/flutter/08网络请求.html) | http、dio、JSON 序列化、API 封装 |
| 09 | [本地存储](/docs/flutter/09本地存储.html) | SharedPreferences、文件 I/O、SQLite/Drift |

## 高级篇

| 序号 | 章节 | 核心内容 |
|------|------|---------|
| 10 | [动画基础与进阶](/docs/flutter/10动画基础与进阶.html) | 隐式动画、显式动画、Hero 过渡 |
| 11 | [自定义绘制与 Sliver](/docs/flutter/11自定义绘制与Sliver.html) | CustomPaint、Canvas、SliverAppBar、时间轴 |
| 12 | [手势与交互](/docs/flutter/12手势与交互.html) | GestureDetector、Dismissible、拖拽排序 |
| 13 | [平台交互与插件](/docs/flutter/13平台交互与插件.html) | MethodChannel、常用插件、自定义插件 |
| 14 | [架构设计](/docs/flutter/14架构设计.html) | 分层架构、Repository 模式、依赖注入 |
| 15 | [测试全攻略](/docs/flutter/15测试全攻略.html) | Unit/Widget/Integration Test、Mock、Golden Test |
| 16 | [性能优化](/docs/flutter/16性能优化.html) | const、RepaintBoundary、DevTools、内存优化 |
| 17 | [主题与国际化](/docs/flutter/17主题与国际化.html) | ThemeData、暗色模式、intl i18n、屏幕适配 |
| 18 | [打包与发布](/docs/flutter/18打包与发布.html) | Android/iOS 签名、上架、CI/CD |

## 贯穿示例

教程全程使用 **Flutter Journal（日记 App）** 作为示例项目，每章的功能都在日记 App 中落地：

- 01-05：搭建日记 App 骨架
- 06-07：日记列表的状态管理
- 08-09：日记的云端同步与本地缓存
- 10-12：日记卡片的动画、绘制、交互
- 13-18：插件集成、架构重构、测试、优化、发布
