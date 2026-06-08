---
layout: TutorialLayout
title: Dart 3 新特性
date: 2026-06-08
category: tech
tags: Dart, Dart3, Records, Pattern Matching, Sealed Class
summary: Dart 3 三大新特性：Records 轻量数据载体、Pattern Matching 模式匹配、Sealed Class 密封类，用新特性重构 Todo 应用
authors: koeltp
---

# Dart 3 新特性

> 上一章我们把 Todo 应用拆分为了多文件项目。本章学习 Dart 3 的三大新特性——Records、Pattern Matching、Sealed Class，并用它们重构项目，让代码更简洁、更安全。

Dart 3 是 Dart 语言的重大更新，引入了三个核心特性，让 Dart 的表达能力上了一个台阶。

## Records — 记录类型

Records 是轻量级的不可变数据载体，不需要定义类就能组合多个值。

### 基本用法

```dart
// 命名字段记录
var user = (name: 'Dart', age: 10);
print(user.name);  // Dart
print(user.age);   // 10

// 位置字段记录
var point = (3, 4);
print(point.$1);  // 3（$1 是第一个位置字段）
print(point.$2);  // 4（$2 是第二个位置字段）

// 混合：位置 + 命名
var record = (1, 'hello', flag: true);
print(record.$1);    // 1
print(record.$2);    // hello
print(record.flag);  // true
```

### 类型声明

```dart
// 命名字段记录类型
typedef UserInfo = ({String name, int age});

// 位置字段记录类型
typedef Point3D = (int, int, int);

// 使用
UserInfo user = (name: 'Dart', age: 10);
Point3D point = (1, 2, 3);
```

### Records vs Class vs Map

| 特性 | Records | Class | Map |
|------|---------|-------|-----|
| 类型安全 | 是 | 是 | 否 |
| 不可变 | 是 | 可选 | 否 |
| 定义成本 | 零 | 需要写 class | 零 |
| 适合场景 | 临时数据组合 | 复杂逻辑 | 动态数据 |

### 实际应用

```dart
// 函数返回多个值
({int ok, List<String> items}) loadItems() {
  return (ok: 1, items: ['a', 'b', 'c']);
}

var result = loadItems();
if (result.ok == 1) {
  print(result.items);
}

// 替代 Map 传递配置
void configure(({String host, int port, bool ssl}) config) {
  print('连接 ${config.ssl ? "https" : "http"}://${config.host}:${config.port}');
}

configure(host: 'localhost', port: 8080, ssl: false);
```

## Pattern Matching — 模式匹配

Dart 3 的模式匹配让数据解构和条件判断更强大。

### 解构赋值

```dart
// Record 解构
var (name, age) = ('Dart', 10);
print(name);  // Dart
print(age);   // 10

// 命名字段解构
var (name: n, age: a) = (name: 'Dart', age: 10);
print(n);  // Dart

// List 解构
var [first, second, ...rest] = [1, 2, 3, 4, 5];
print(first);  // 1
print(rest);   // [3, 4, 5]

// Map 解构
var {'name': userName, 'age': userAge} = {'name': 'Dart', 'age': 10};
print(userName);  // Dart
```

### switch 模式匹配

```dart
// 类型匹配
String describe(Object value) {
  return switch (value) {
    int i => '整数：$i',
    String s => '字符串：$s',
    List l => '列表，长度 ${l.length}',
    _ => '其他类型',
  };
}

print(describe(42));       // 整数：42
print(describe('hello'));  // 字符串：hello
print(describe([1, 2]));   // 列表，长度 2
```

### 守卫条件

```dart
String categorize(int score) {
  return switch (score) {
    >= 90 => '优秀',
    >= 80 => '良好',
    >= 60 => '及格',
    > 0 => '不及格',
    _ => '无效分数',
  };
}
```

### 解构 + 匹配

```dart
// 匹配 Record 结构
String process((int, String) input) {
  return switch (input) {
    (0, 'idle') => '空闲',
    (1, 'running') => '运行中',
    (2, 'done') => '完成',
    (int code, String msg) => '未知状态：$code - $msg',
  };
}

// 匹配 List 结构
String classify(List<int> list) {
  return switch (list) {
    [] => '空列表',
    [var single] => '单元素：$single',
    [var first, var second] => '两个元素：$first, $second',
    [var first, ..., var last] => '首：$first，尾：$last',
  };
}
```

### if-case

```dart
var value = [1, 2, 3];

if (value case [var first, ...]) {
  print('第一个元素：$first');  // 1
}

// 匹配 Map 中的特定结构
var data = {'type': 'user', 'name': 'Dart'};
if (data case {'type': 'user', 'name': var name}) {
  print('用户名：$name');  // Dart
}
```

## Sealed Class — 密封类

Sealed class 限制子类只能在同一文件中定义，编译器能穷举所有子类型。

### 基本用法

```dart
sealed class Result<T> {}

class Success<T> extends Result<T> {
  final T data;
  Success(this.data);
}

class Failure<T> extends Result<T> {
  final String error;
  Failure(this.error);
}

// switch 必须穷举所有子类，否则编译报错
String handle(Result<int> result) {
  return switch (result) {
    Success(data: var d) => '成功：$d',
    Failure(error: var e) => '失败：$e',
  };
}
```

### 替代传统继承体系

```dart
// 用 sealed class 建模状态机
sealed class ConnectionState {}

class Disconnected extends ConnectionState {
  final String reason;
  Disconnected(this.reason);
}

class Connecting extends ConnectionState {}

class Connected extends ConnectionState {
  final Duration latency;
  Connected(this.latency);
}

class Reconnecting extends ConnectionState {
  final int attempt;
  Reconnecting(this.attempt);
}

// 编译器保证处理了所有状态
void onStateChange(ConnectionState state) {
  switch (state) {
    case Disconnected(reason: var r):
      print('断开：$r');
    case Connecting():
      print('连接中...');
    case Connected(latency: var l):
      print('已连接，延迟 ${l.inMilliseconds}ms');
    case Reconnecting(attempt: var n):
      print('重连中，第 $n 次');
  }
}
```

### Sealed vs abstract vs enum

| 特性 | sealed | abstract | enum |
|------|--------|----------|------|
| 子类有限 | 是 | 否 | 是 |
| 子类可带状态 | 是 | 是 | Dart 3 支持 |
| switch 穷举检查 | 是 | 否 | 是 |
| 跨文件子类 | 否 | 是 | 否 |

## 实战：用 Dart 3 重构 Todo 应用

### 用 Records 替代临时 Map

```dart
// 之前：用 Map 传递搜索条件
// Map<String, dynamic> filter = {'keyword': 'Dart', 'completed': false};

// 现在：用 Record 类型安全地传递
typedef TodoFilter = ({String keyword, bool? completed, int? priority});

List<Todo> filterTodos(List<Todo> todos, TodoFilter filter) {
  return todos.where((todo) {
    if (filter.keyword.isNotEmpty && !todo.content.contains(filter.keyword)) {
      return false;
    }
    if (filter.completed != null && todo.completed != filter.completed) {
      return false;
    }
    return true;
  }).toList();
}

// 调用
var results = filterTodos(todos, (keyword: 'Dart', completed: false, priority: null));
```

### 用 Sealed Class 建模命令

```dart
sealed class TodoCommand {}

class AddCommand extends TodoCommand {
  final String content;
  AddCommand(this.content);
}

class ListCommand extends TodoCommand {
  final bool? completed;
  ListCommand({this.completed});
}

class DoneCommand extends TodoCommand {
  final int id;
  DoneCommand(this.id);
}

class QuitCommand extends TodoCommand {}

// 解析命令 — 编译器保证处理了所有命令类型
TodoCommand? parseCommand(String input) {
  var parts = input.split(' ');
  return switch (parts) {
    ['add', ...var rest] when rest.isNotEmpty =>
      AddCommand(rest.join(' ')),
    ['list'] => ListCommand(),
    ['list', 'done'] => ListCommand(completed: true),
    ['list', 'pending'] => ListCommand(completed: false),
    ['done', var idStr] when int.tryParse(idStr) case var id? =>
      DoneCommand(id),
    ['quit'] => QuitCommand(),
    _ => null,
  };
}

// 执行命令 — 穷举所有情况
Future<void> executeCommand(TodoCommand command, TodoRepository repo) async {
  switch (command) {
    case AddCommand(content: var c):
      var todo = await repo.add(c);
      print('已添加：$todo');
    case ListCommand(completed: var filter):
      var list = filter == null ? repo.all
        : filter ? repo.completed : repo.pending;
      if (list.isEmpty) {
        print('没有待办事项');
      } else {
        list.forEach(print);
      }
    case DoneCommand(id: var id):
      if (await repo.markDone(id)) {
        print('已完成 #$id');
      } else {
        print('找不到 #$id');
      }
    case QuitCommand():
      print('再见！');
      exit(0);
  }
}
```

### 用 Pattern Matching 简化逻辑

```dart
// 格式化显示
String formatTodo(Todo todo) {
  return switch (todo) {
    Todo(completed: true, content: var c, id: var i) =>
      '#$i $c ✓',
    Todo(completed: false, content: var c, id: var i) =>
      '#$i $c',
  };
}

// 统计摘要
String summarize(List<Todo> todos) {
  var done = todos.where((t) => t.completed).length;
  var pending = todos.length - done;
  return switch ((done, pending)) {
    (0, 0) => '没有待办事项',
    (_, 0) => '全部完成！',
    (0, _) => '共 $pending 项待完成',
    (var d, var p) => '$d 项完成，$p 项待完成',
  };
}
```

## 小结

| 特性 | 用途 | 优势 |
|------|------|------|
| Records | 轻量数据组合 | 类型安全、不可变、零定义成本 |
| Pattern Matching | 数据解构与匹配 | 编译器穷举检查、代码更简洁 |
| Sealed Class | 有限子类型体系 | switch 穷举安全、建模状态机 |

## 踩坑提示

::: warning 常见问题
1. **Records 是不可变的** — 不能修改字段值，需要变更时创建新 Record
2. **switch 必须穷举** — sealed class 的 switch 漏掉一个子类就编译报错，这是特性不是 bug
3. **Pattern 中 `when` 守卫** — 复杂条件用 `when`，但会降低穷举检查的效果
4. **Records 不适合复杂逻辑** — 需要方法时还是用 class，Records 只适合纯数据
5. **Sealed class 子类不能跨文件** — 这是设计约束，保证穷举的完整性
:::

## 练习题

1. 用 Record 类型定义一个 `(statusCode: int, message: String, data: T?)` 泛型响应类型
2. 用 switch 表达式 + 模式匹配实现：输入 `(int, int)` 坐标，判断在哪个象限
3. 用 sealed class 建模一个订单状态：Created → Paid → Shipped → Delivered / Cancelled
4. 用 pattern matching 重写以下 if-else 链：
   ```dart
   if (value is int && value > 0) {
     return '正整数';
   } else if (value is int) {
     return '非正整数';
   } else if (value is String) {
     return '字符串';
   } else {
     return '其他';
   }
   ```

---

**恭喜你完成了整个 Dart 教程！** 你已经从零开始学会了 Dart 语言的核心知识，并构建了一个完整的命令行 Todo 应用。接下来，你可以：

- 学习 [Flutter 教程](../flutter/index.html)，用 Dart 构建跨平台 UI 应用
- 在 [DartPad](https://dartpad.dev/) 中继续练习
- 阅读 [Dart 官方文档](https://dart.dev/guides) 深入了解
