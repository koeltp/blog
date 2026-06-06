---
title: 自定义绘制与 Sliver
date: 2026-06-06
category: tech
tags: Flutter, CustomPaint, Canvas, Sliver, CustomScrollView, SliverAppBar
summary: 掌握 Flutter 自定义绘制：CustomPaint + Canvas 绑定路径与渐变、SliverAppBar + CustomScrollView 实现日记时间轴
authors: koeltp
---

## 一、CustomPaint 自定义绘制

当内置 Widget 无法满足 UI 需求时，用 CustomPaint 直接在 Canvas 上画。

### 1.1 基本结构

```dart
class MyPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // size 是 CustomPaint 分配的绘制区域大小
    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    // 画圆
    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width / 4,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// 使用
CustomPaint(
  size: const Size(200, 200),
  painter: MyPainter(),
)
```

### 1.2 Paint 画笔配置

```dart
final paint = Paint()
  ..color = Colors.indigo
  ..strokeWidth = 3
  ..style = PaintingStyle.fill    // fill 填充 / stroke 描边
  ..strokeCap = StrokeCap.round   // 线头形状
  ..strokeJoin = StrokeJoin.round // 线段连接
  ..shader = LinearGradient(       // 渐变
      colors: [Colors.blue, Colors.purple],
    ).createShader(Rect.fromLTWH(0, 0, 200, 200))
  ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5)  // 模糊
  ..colorFilter = ColorFilter.mode(Colors.red, BlendMode.srcOver);  // 滤镜
```

### 1.3 Canvas 常用绘制方法

```dart
// 直线
canvas.drawLine(Offset(0, 0), Offset(100, 100), paint);

// 矩形
canvas.drawRect(Rect.fromLTWH(10, 10, 100, 50), paint);

// 圆角矩形
canvas.drawRRect(RRect.fromRectAndRadius(
  Rect.fromLTWH(10, 10, 100, 50),
  Radius.circular(8),
), paint);

// 圆
canvas.drawCircle(Offset(100, 100), 50, paint);

// 椭圆
canvas.drawOval(Rect.fromLTWH(10, 10, 200, 100), paint);

// 路径
final path = Path()
  ..moveTo(0, 100)
  ..lineTo(50, 0)
  ..lineTo(100, 100)
  ..close();
canvas.drawPath(path, paint);

// 文字
final textPainter = TextPainter(
  text: TextSpan(text: '日记', style: TextStyle(color: Colors.white, fontSize: 16)),
  textDirection: TextDirection.ltr,
);
textPainter.layout();
textPainter.paint(canvas, Offset(50, 50));

// 变换
canvas.save();
canvas.translate(100, 100);
canvas.rotate(pi / 4);
canvas.scale(1.5);
// ... 绘制
canvas.restore();
```

### 1.4 实战：日记统计环形图

```dart
class RingChartPainter extends CustomPainter {
  final Map<String, double> data;
  final List<Color> colors;

  RingChartPainter({required this.data, required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 20;
    final strokeWidth = 30.0;

    var startAngle = -pi / 2;
    final total = data.values.fold(0.0, (a, b) => a + b);

    var i = 0;
    for (final entry in data.entries) {
      final sweepAngle = (entry.value / total) * 2 * pi;
      final paint = Paint()
        ..color = colors[i % colors.length]
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        paint,
      );

      startAngle += sweepAngle;
      i++;
    }

    // 中心文字
    final textPainter = TextPainter(
      text: TextSpan(
        text: '${total.toInt()}',
        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black87),
        children: const [TextSpan(text: '\n篇日记', style: TextStyle(fontSize: 14, color: Colors.grey))],
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(
      center.dx - textPainter.width / 2,
      center.dy - textPainter.height / 2,
    ));
  }

  @override
  bool shouldRepaint(covariant RingChartPainter old) => data != old.data;
}
```

## 二、Sliver 系列

Sliver 是 CustomScrollView 中的可滚动子元素，可以实现各种滚动效果。

### 2.1 CustomScrollView 基础

```dart
CustomScrollView(
  slivers: [
    SliverAppBar(
      expandedHeight: 200,
      floating: false,
      pinned: true,  // 滚动时固定在顶部
      flexibleSpace: FlexibleSpaceBar(
        title: const Text('我的日记'),
        background: Image.asset('images/cover.jpg', fit: BoxFit.cover),
      ),
    ),
    SliverToBoxAdapter(child: _buildCategoryFilter()),
    SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) => JournalCard(journal: journals[index]),
        childCount: journals.length,
      ),
    ),
    SliverFillRemaining(
      child: Center(child: Text('没有更多了')),
    ),
  ],
)
```

### 2.2 常用 Sliver

| Sliver | 作用 |
|--------|------|
| SliverAppBar | 可折叠的顶部栏 |
| SliverList | 线性列表 |
| SliverGrid | 网格布局 |
| SliverToBoxAdapter | 包裹普通 Widget |
| SliverPersistentHeader | 自定义固定头部 |
| SliverFillRemaining | 填充剩余空间 |

### 2.3 实战：日记时间轴

```dart
class TimelinePage extends StatelessWidget {
  final List<Journal> journals;

  const TimelinePage({super.key, required this.journals});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverAppBar(title: Text('时间轴'), pinned: true),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => _TimelineItem(
              journal: journals[index],
              isFirst: index == 0,
              isLast: index == journals.length - 1,
            ),
            childCount: journals.length,
          ),
        ),
      ],
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final Journal journal;
  final bool isFirst;
  final bool isLast;

  const _TimelineItem({required this.journal, this.isFirst = false, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        children: [
          // 时间轴左侧
          SizedBox(
            width: 80,
            child: Column(
              children: [
                Text(journal.createdAt.day.toString(),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                Text(_monthName(journal.createdAt.month),
                    style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
          // 时间轴线
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(width: 2, height: isFirst ? 20 : 40, color: Colors.grey.shade300),
                Container(width: 12, height: 12, decoration: const BoxDecoration(
                  color: Colors.indigo, shape: BoxShape.circle,
                )),
                Expanded(child: Container(width: 2, color: Colors.grey.shade300)),
              ],
            ),
          ),
          // 内容卡片
          Expanded(
            child: Card(
              margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(journal.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(journal.summary, style: TextStyle(color: Colors.grey.shade600)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _monthName(int month) {
    const names = ['', '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'];
    return names[month];
  }
}
```

## 三、小结

| 主题 | 核心要点 |
|------|---------|
| CustomPaint | Canvas + Paint 直接绘制，适合复杂图形 |
| Sliver | CustomScrollView 中的可滚动子元素 |
| SliverAppBar | 可折叠顶栏，pinned/floating 控制 |
| 时间轴 | Row + 竖线 + 卡片组合 |

---

上一篇：[动画基础与进阶](tutorial.html?type=flutter&file=10动画基础与进阶.md)

下一篇：[手势与交互](tutorial.html?type=flutter&file=12手势与交互.md)
