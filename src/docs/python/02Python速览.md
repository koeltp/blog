---
layout: TutorialLayout
title: Python 速览
date: 2026-06-29
category: tech
tags: Python, 变量, 数据类型, 输入输出, 格式化
summary: 系统学习 Python 的核心数据类型、变量赋值、输入输出和字符串格式化，建立对 Python 语法的整体认知
authors: taipi
---

## 一、Python 的核心数据类型

Python 有八种基本数据类型，初学者最需要掌握前五种。

### 1.1 数值类型

```python
# 整数 int：任意精度，没有大小限制
small = 42
large = 99999999999999999999999
negative = -7

# 浮点数 float：双精度 64 位
exact = 3.14
scientific = 6.02e23      # 科学计数法，等于 6.02 × 10^23
tiny = 1.6e-19             # 等于 1.6 × 10^-19

# 复数 complex（AI 开发中较少用，但了解一下）
complex_num = 3 + 4j
```

### 1.2 字符串 str

字符串是 Python 中使用最频繁的类型之一，在 AI/LLM 场景中更是核心数据结构。

```python
# 三种引号都可以
s1 = "双引号"
s2 = '单引号'
s3 = """多行字符串
可以包含换行符"""

# 字符串是不可变的：不能修改单个字符
text = "hello"
# text[0] = "H"  # ✗ TypeError: 'str' object does not support item assignment
```

### 1.3 布尔值 bool

```python
flag_true = True
flag_false = False

# 注意：Python 中布尔值是 int 的子类
print(isinstance(True, int))   # True
print(True + 1)                # 2（True 相当于 1，False 相当于 0）

# 但实际开发中不要用这种特性
```

### 1.4 NoneType

```python
# None 表示"空值"，类似于其他语言的 null
result = None
print(result)  # None

# None 在条件判断中等价于 False
if None:
    print("不会执行")
if not None:
    print("会执行")  # ✓
```

### 1.5 类型速查表

| 类型 | 示例 | 说明 |
|------|------|------|
| `int` | `42`, `-7`, `0` | 整数 |
| `float` | `3.14`, `6.02e23` | 浮点数 |
| `str` | `"hello"`, `'world'` | 字符串 |
| `bool` | `True`, `False` | 布尔值 |
| `NoneType` | `None` | 空值 |

## 二、变量与作用域

### 2.1 变量命名规则

```python
# ✓ 合法的变量名
user_name = "Alice"
age = 25
_private = "私有变量约定"
MAX_SIZE = 100
camelCase = "也可以用"

# ✗ 非法的变量名
# 1var = "不能以数字开头"
# var-name = "不能有连字符"（可以用下划线）
# class = "不能用关键字"  # SyntaxError

# Python 关键字（不能作为变量名）
# False, None, True, and, as, assert, async, await, break, class,
# continue, def, del, elif, else, except, finally, for, from, global,
# if, import, in, is, lambda, nonlocal, not, or, pass, raise,
# return, try, while, with, yield
```

### 2.2 作用域

```python
global_var = "全局变量"  # 模块级别定义

def my_function():
    local_var = "局部变量"  # 函数内部定义
    print(global_var)  # ✓ 可以访问全局变量
    # print(local_var)  # ✗ 函数外部无法访问

my_function()
# print(local_var)  # ✗ NameError
```

## 三、输入与输出

### 3.1 print 函数详解

```python
# 基本用法
print("Hello")           # 输出：Hello
print("Hello", "World")  # 输出：Hello World（默认用空格分隔）

# sep 参数：自定义分隔符
print("2024", "01", "15", sep="-")   # 2024-01-15
print("A", "B", "C", sep="|")        # A|B|C

# end 参数：自定义结尾（默认换行）
print("Hello", end=" ")
print("World")  # 输出：Hello World（同一行）

# file 参数：输出到文件
with open("output.txt", "w") as f:
    print("写入文件", file=f)

# flush 参数：强制刷新缓冲区
print("加载中...", end="", flush=True)
# 模拟进度
import time
for i in range(1, 6):
    print(".", end="", flush=True)
    time.sleep(0.3)
print()  # 换行
# 输出：.....
```

### 3.2 input 函数

```python
# input 返回的是字符串，需要手动转换
name = input("请输入你的名字：")
age = int(input("请输入你的年龄："))  # 转换为整数
height = float(input("请输入你的身高（米）："))  # 转换为浮点数

print(f"你好 {name}，你 {age} 岁，身高 {height} 米")
```

> **注意**：`input()` 返回的永远是字符串类型，即使是数字也必须手动转换。这是新手最常见的错误来源。

## 四、字符串格式化

Python 有三种字符串格式化方式，推荐使用 f-string。

### 4.1 f-string（推荐）

```python
name = "Alice"
age = 25
salary = 12345.678

# 基本用法
print(f"我叫 {name}，今年 {age} 岁")

# 表达式
print(f"明年我 {age + 1} 岁")

# 格式化数字
print(f"月薪：¥{salary:,.2f}")  # 月薪：¥12,345.68
print(f"百分比：{0.85:.0%}")     # 百分比：85%

# 对齐
print(f"{'左对齐':<20}{'右对齐':>20}")
# 左对齐              右对齐
print(f"{'居中':^20}")          # 居中

# 类型限定
print(f"整数：{42:d}")           # 整数：42
print(f"二进制：{42:b}")         # 二进制：101010
print(f"十六进制：{42:x}")       # 十六进制：2a
print(f"科学计数：{1234567:.2e}")  # 科学计数：1.23e+06
```

### 4.2 format 方法

```python
# 位置参数
print("{} 今年 {} 岁".format("Alice", 25))

# 索引参数
print("{0} 喜欢 {1}，{1} 也很开心".format("Alice", "Python"))

# 命名参数
print("我叫 {name}，来自 {city}".format(name="Alice", city="北京"))

# 格式说明
print("月薪：¥{:,.2f}".format(12345.678))
```

### 4.3 % 格式化（旧式，了解即可）

```python
name = "Alice"
age = 25
print("我叫 %s，今年 %d 岁" % (name, age))
print("月薪：¥%.2f" % 12345.678)
```

> **为什么推荐 f-string？** f-string 性能最好（在运行时直接替换）、语法最简洁、可读性最强。它是 Python 3.6+ 引入的特性，现在已经是事实标准。

## 五、类型转换与检查

### 5.1 内置类型转换函数

```python
# 数值转换
int("42")          # 42
int(3.9)           # 3（截断，不是四舍五入）
float("3.14")      # 3.14
round(3.14159, 2)  # 3.14（四舍五入）

# 字符串转换
str(42)            # "42"
str([1, 2, 3])     # "[1, 2, 3]"

# 布尔转换
bool(1)            # True
bool(0)            # False
bool("")           # False（空字符串）
bool("hello")      # True
bool([])           # False（空列表）
bool([1, 2])       # True（非空列表）

#  truthy/falsy 规则：
# 以下值为 False：None, False, 0, 0.0, "", [], {}, set(), range(0)
# 其余都为 True
```

### 5.2 类型检查

```python
# isinstance 是推荐的类型检查方式
print(isinstance(42, int))        # True
print(isinstance(3.14, (int, float)))  # True（可以是多种类型之一）

# type() 用于精确匹配
print(type(42) is int)            # True
print(type(42) is float)          # False
```

## 六、注释与文档

### 6.1 单行注释

```python
# 这是单行注释
x = 10  # 行尾注释
```

### 6.2 多行注释（实际是字符串字面量）

```python
"""
这是一个多行字符串，
通常用作文档字符串（docstring）。
"""
```

### 6.3 文档字符串（docstring）

```python
def calculate_bmi(weight_kg: float, height_m: float) -> float:
    """计算身体质量指数（BMI）

    Args:
        weight_kg: 体重（千克）
        height_m: 身高（米）

    Returns:
        BMI 值

    Raises:
        ValueError: 当身高或体重为非正数时
    """
    if weight_kg <= 0 or height_m <= 0:
        raise ValueError("身高和体重必须为正数")
    return weight_kg / (height_m ** 2)

# 查看文档字符串
print(calculate_bmi.__doc__)
```

> **为什么写 docstring？** AI/LLM 开发中，你经常需要阅读他人写的代码（如 LangChain 源码）。清晰的文档字符串能让代码自解释，减少阅读成本。

## 七、Python 在 AI/LLM 开发中的常见模式

### 7.1 字符串操作是日常工作的核心

```python
# LLM 的输入输出本质上都是字符串
prompt = f"""你是一个助手。请用简洁的语言回答以下问题：

问题：{user_question}

回答："""

# 常见的字符串处理
response = "Hello, World!"
cleaned = response.lower().strip()  # "hello, world!"
words = cleaned.split(", ")         # ["hello, world!"]
joined = " ".join(words)            # "hello world!"
```

### 7.2 字典是 JSON/API 响应的天然映射

```python
# LLM API 的请求和响应几乎全是 JSON，Python 中用字典处理
api_response = {
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "你好！有什么我可以帮你的吗？"
            }
        }
    ],
    "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 15
    }
}

# 提取内容
answer = api_response["choices"][0]["message"]["content"]
print(answer)  # 你好！有什么我可以帮你的吗？
```

## 八、本章小结

| 概念 | 核心要点 |
|------|---------|
| 数据类型 | int、float、str、bool、None 五种最常用 |
| 变量 | 动态类型，命名用小写下划线 |
| 输入输出 | `print()` 和 `input()`，input 返回字符串 |
| 格式化 | 优先使用 f-string |
| 类型转换 | 手动转换，注意 `int("abc")` 会报错 |
| 注释 | 单行 `#`，文档字符串 `"""..."""` |

## 九、练习

1. 编写一个温度转换器：输入摄氏度，输出华氏度和开尔文温度
   - 公式：F = C × 9/5 + 32，K = C + 273.15

2. 编写一个程序，输入一个学生的三门成绩，计算平均分并输出等级（A: ≥90, B: ≥80, C: ≥60, D: <60）

3. 使用 f-string 格式化输出：姓名、年龄、月薪，月薪用千分位和两位小数

4. 在 REPL 中尝试 `bool(0)`、`bool("")`、`bool([])`、`bool(None)`，总结规律
