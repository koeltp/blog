---
layout: TutorialLayout
title: JSON 与数据处理
date: 2026-06-29
category: tech
tags: Python, JSON, pandas, numpy, 数据处理, 数据清洗
summary: 掌握 Python JSON 模块、pandas DataFrame 基础操作和 numpy 数组运算，为 AI/LLM 数据预处理打下基础
authors: taipi
---

## 一、JSON 处理

### 1.1 基本序列化与反序列化

```python
import json

# Python 对象 → JSON 字符串
data = {"name": "Alice", "age": 25, "scores": [95, 87, 92]}
json_str = json.dumps(data, ensure_ascii=False, indent=2)
print(json_str)

# JSON 字符串 → Python 对象
parsed = json.loads(json_str)
print(parsed["name"])  # Alice

# 直接写入/读取文件
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open("data.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
```

### 1.2 JSON 与 Python 类型映射

| Python | JSON |
|--------|------|
| `dict` | `object` |
| `list` / `tuple` | `array` |
| `str` | `string` |
| `int` / `float` | `number` |
| `True` / `False` | `true` / `false` |
| `None` | `null` |

### 1.3 处理复杂 JSON

```python
import json

# 嵌套 JSON
response = '''
{
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "Python 是一门编程语言。"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 8
    }
}
'''

data = json.loads(response)
answer = data["choices"][0]["message"]["content"]
print(answer)  # Python 是一门编程语言。

# 安全访问嵌套数据
def safe_get(obj, *keys, default=None):
    """安全获取嵌套字典的值"""
    for key in keys:
        if isinstance(obj, dict):
            obj = obj.get(key)
        else:
            return default
        if obj is None:
            return default
    return obj

answer = safe_get(data, "choices", 0, "message", "content", default="无回复")
```

## 二、pandas 入门

### 2.1 Series 与 DataFrame

```python
import pandas as pd

# Series：一维数组
s = pd.Series([95, 87, 92], index=["Alice", "Bob", "Charlie"])
print(s)
# Alice        95
# Bob          87
# Charlie     92

# DataFrame：二维表格
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "score": [95, 87, 92],
    "grade": ["A", "B", "A"],
})
print(df)
```

### 2.2 数据读取与写入

```python
# 读取 CSV
df = pd.read_csv("data.csv")
df = pd.read_csv("data.csv", encoding="utf-8")
df = pd.read_csv("data.csv", nrows=100)  # 只读前 100 行

# 读取 JSON
df = pd.read_json("data.json")

# 写入
df.to_csv("output.csv", index=False, encoding="utf-8")
df.to_json("output.json", orient="records", force_ascii=False, indent=2)

# 从 Excel 读取
df = pd.read_excel("data.xlsx", sheet_name="Sheet1")
```

### 2.3 数据探索

```python
df = pd.read_csv("students.csv")

# 基本信息
print(df.shape)        # (行数, 列数)
print(df.columns)      # 列名
print(df.dtypes)       # 数据类型
print(df.info())       # 综合信息

# 前几行/后几行
print(df.head(5))
print(df.tail(3))

# 统计摘要
print(df.describe())
# 输出 count/mean/std/min/max 等

# 缺失值
print(df.isnull().sum())
print(df.dropna())  # 删除缺失值
print(df.fillna(0))  # 填充缺失值
```

### 2.4 数据筛选与排序

```python
# 列选择
df["name"]       # Series
df[["name", "score"]]  # DataFrame

# 条件筛选
high_scorers = df[df["score"] >= 90]
arts_students = df[(df["grade"] == "A") & (df["subject"] == "math")]

# isin 过滤
target_names = ["Alice", "Bob"]
filtered = df[df["name"].isin(target_names)]

# 排序
sorted_df = df.sort_values("score", ascending=False)
```

### 2.5 数据变换

```python
# 添加新列
df["rank"] = df["score"].rank(ascending=False, method="min").astype(int)

# 字符串处理
df["name_upper"] = df["name"].str.upper()
df["initial"] = df["name"].str[0]

# 数值计算
df["score_plus10"] = df["score"] + 10

# 分组聚合
grouped = df.groupby("grade")["score"].agg(["mean", "max", "count"])
print(grouped)

# 透视表
pivot = pd.pivot_table(df, values="score", index="grade", columns="subject", aggfunc="mean")
```

## 三、numpy 基础

### 3.1 数组操作

```python
import numpy as np

# 创建数组
arr = np.array([1, 2, 3, 4, 5])
zeros = np.zeros(5)
ones = np.ones((3, 4))
rand = np.random.rand(3, 4)  # 0-1 均匀分布
range_arr = np.arange(0, 10, 2)  # [0, 2, 4, 6, 8]

# 多维数组
matrix = np.array([[1, 2, 3], [4, 5, 6]])
print(matrix.shape)    # (2, 3)
print(matrix.ndim)     # 2

# 向量化运算（比循环快得多）
arr = np.array([1, 2, 3, 4, 5])
print(arr * 2)         # [2, 4, 6, 8, 10]
print(arr ** 2)        # [1, 4, 9, 16, 25]
print(np.sum(arr))     # 15
print(np.mean(arr))    # 3.0
print(np.std(arr))     # 标准差
```

### 3.2 数组索引与切片

```python
arr = np.array([10, 20, 30, 40, 50])

# 索引
print(arr[0])     # 10
print(arr[-1])    # 50

# 切片
print(arr[1:4])   # [20, 30, 40]

# 布尔索引
big = arr[arr > 25]  # [30, 40, 50]

# 二维数组
matrix = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print(matrix[0, :])    # [1, 2, 3]（第一行）
print(matrix[:, 2])    # [3, 6, 9]（第三列）
print(matrix[1:3, 0:2])  # [[4, 5], [7, 8]]
```

## 四、AI/LLM 数据处理实战

### 4.1 处理 LLM 批量响应

```python
import pandas as pd
import json

# 模拟 LLM 批量处理结果
results = [
    {"prompt": "Python 是什么？", "response": "一门编程语言。", "tokens": 15, "latency_ms": 230},
    {"prompt": "什么是 AI？", "response": "人工智能。", "tokens": 12, "latency_ms": 180},
    {"prompt": "如何学编程？", "response": "从 Python 开始。", "tokens": 18, "latency_ms": 310},
]

# 转为 DataFrame 分析
df = pd.DataFrame(results)
print(df.describe())
# 平均 token 数、平均延迟等

# 找出延迟最高的请求
slowest = df.loc[df["latency_ms"].idxmax()]
print(f"最慢请求：{slowest['prompt']}，延迟 {slowest['latency_ms']}ms")
```

### 4.2 数据清洗

```python
import pandas as pd
import numpy as np

# 模拟脏数据
dirty_data = {
    "name": ["Alice", " Bob ", "Charlie", None, "Alice"],
    "score": [95, "87", np.nan, 92, 95],
    "grade": ["A", "B", "A", "A", "A"],
}
df = pd.DataFrame(dirty_data)

# 清洗步骤
# 1. 去除重复
df = df.drop_duplicates()

# 2. 填充/删除缺失值
df["score"] = df["score"].fillna(df["score"].median())

# 3. 类型转换
df["score"] = df["score"].astype(float)

# 4. 字符串清理
df["name"] = df["name"].str.strip()

print(df)
```

## 五、本章小结

| 模块 | 核心功能 |
|------|---------|
| json | dumps/loads/dump/load |
| pandas DataFrame | 表格数据处理、筛选、聚合 |
| pandas IO | read_csv/read_json/to_csv/to_json |
| numpy | 数组、向量化运算、广播 |

## 六、练习

1. 读取一个 CSV 文件，统计每个 grade 的平均 score

2. 使用 numpy 计算一个 1000x1000 矩阵的乘法（对比循环方式的速度）

3. 清洗一份包含缺失值和重复行的 JSON 数据

4. **AI 场景**：将 LLM API 的批量响应保存为 JSON Lines 格式