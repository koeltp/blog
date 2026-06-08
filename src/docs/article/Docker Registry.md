---
layout: TutorialLayout
title: Docker Registry
date: 2026-05-08
category: docker
tags: IT
---

经常遇到docker image pull失败的，这是经过社区验证的几个比好用的镜像地址：
```json title="registry"
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ],
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
修改步骤：
- 打开 Docker Desktop。
- 点击右上角的 设置（Settings） 图标（小齿轮）。
- 在左侧菜单选择 Docker Engine。
- 你将看到一个 JSON 配置文件。
- 替换为上面的。