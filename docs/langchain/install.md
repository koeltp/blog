# LangChain 安装教程

1. 安装LangChain：

[tabs]
```bash name="pip"
pip install -U langchain
# Requires Python 3.10+
```
```java name="uv"
uv add langchain
# Requires Python 3.10+
```
```java name="uv"
uv add langchain
# Requires Python 3.10+
```
[/tabs]


2. 配置API密钥：

```python name="api-key-example"
import os
os.environ["OPENAI_API_KEY"] = "你的API密钥"
```

3. 创建你的第一个应用：

```python name="first-app-example"
from langchain.llms import OpenAI
llm = OpenAI(temperature=0.7)
print(llm("什么是LangChain？"))
```

## 高级功能

- **文档处理**：加载、分割和检索文档
- **向量存储**：使用向量数据库进行语义搜索
- **评估**：评估模型性能
- **监控**：监控应用运行状态

## 最佳实践

1. 从简单开始，逐步添加复杂性
2. 充分利用LangChain的组件生态系统
3. 关注提示工程，优化模型输出
4. 合理使用记忆和代理功能

## 总结

LangChain为构建LLM应用提供了强大的工具和框架，使开发过程更加高效和可扩展。通过本教程的学习，你应该已经掌握了LangChain的基本概念和使用方法，可以开始构建自己的LLM应用了。

```text name="hel"
hello world
```

```c
int main() {
    printf("Hello, World!\n");
    return 0;
}
```