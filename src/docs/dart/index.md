---
layout: TutorialLayout
---

# Dart教程

## 什么是Dart？

Dart是一种由Google开发的开源编程语言，主要用于构建Flutter应用。它是一种面向对象的、类定义的、垃圾回收的语言，具有C风格的语法。

## 核心特性

### 1. 强类型

Dart是强类型语言，但也支持类型推断：

```dart
// 显式类型
String name = 'Dart';

// 类型推断
var age = 25;
```

### 2. 面向对象

Dart是一种真正的面向对象语言，一切都是对象：

```dart
class Person {
  String name;
  int age;
  
  Person(this.name, this.age);
  
  void greet() {
    print('Hello, my name is $name');
  }
}

void main() {
  var person = Person('John', 30);
  person.greet();
}
```

### 3. 异步编程

Dart提供了强大的异步编程支持：

```dart
Future<String> fetchData() async {
  await Future.delayed(Duration(seconds: 2));
  return 'Data loaded';
}

void main() async {
  print('开始加载数据...');
  var data = await fetchData();
  print(data);
  print('数据加载完成');
}
```

## 基本语法

### 变量和常量

```dart
var name = 'Dart'; // 类型推断
String language = 'Dart'; // 显式类型
final pi = 3.14; // 不可变变量
const maxAge = 100; // 编译时常量
```

### 函数

```dart
int add(int a, int b) {
  return a + b;
}

// 箭头函数
int subtract(int a, int b) => a - b;
```

### 控制流

```dart
if (age >= 18) {
  print('成年人');
} else {
  print('未成年人');
}

for (var i = 0; i < 5; i++) {
  print(i);
}

switch (day) {
  case 'Monday':
    print('工作日');
    break;
  case 'Sunday':
    print('休息日');
    break;
  default:
    print('其他');
}
```

## 集合

### List

```dart
var numbers = [1, 2, 3, 4, 5];
numbers.add(6);
numbers.removeAt(0);
```

### Map

```dart
var person = {
  'name': 'John',
  'age': 30,
  'city': 'New York'
};
print(person['name']);
```

## 异常处理

```dart
try {
  var result = 10 ~/ 0;
} catch (e) {
  print('错误: $e');
} finally {
  print('无论如何都会执行');
}
```

## 总结

Dart是一种现代化的编程语言，为Flutter应用开发提供了坚实的基础。它的语法简洁明了，功能强大，支持面向对象编程和异步编程。通过本教程的学习，你应该已经掌握了Dart的基本语法和核心概念，可以开始编写Dart程序了。