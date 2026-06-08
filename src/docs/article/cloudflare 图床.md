---
layout: TutorialLayout
title: 使用 Cloudflare 搭建图床 CDN 及防盗链配置指南
date: 2026-04-18
category: tech
tags: Cloudflare, R2, CDN, 图床
summary: 详细介绍如何使用 Cloudflare R2 对象存储搭建图床 CDN，并配置防盗链保护
---
## 一、准备工作

### 1.1 前提条件

- 已注册域名：taipi.top（已托管在 Cloudflare）
- Cloudflare 账号
- R2 对象存储（Cloudflare 提供）

### 1.2 确认 DNS 状态

```bash title="bash"
nslookup -qt=ns taipi.top
```

确保返回的 nameserver 包含 cloudflare.com，说明域名已在 Cloudflare 托管。

## 二、创建 R2 存储桶

### 2.1 新建存储桶

1. 登录 Cloudflare 控制台
2. 左侧菜单 → R2 → 创建存储桶
3. 填写桶名称：taipi-img（示例）
4. 选择区域：自动（推荐）

### 2.2 上传图片

1. 进入存储桶
2. 创建文件夹：img/
3. 上传图片文件，例如：tplogo2.png
4. 文件路径：img/tplogo2.png

## 三、配置自定义域名（图床）

### 3.1 绑定域名

1. R2 存储桶 → 设置 → 自定义域名
2. 点击 **连接自定义域名**
3. 输入：cdn.taipi.top
4. 开启 **通过 Cloudflare 代理流量**（橙色云朵图标）

### 3.2 自动 DNS 配置

Cloudflare 会自动添加一条 CNAME 记录：

```text
cdn.taipi.top → <bucket-id>.r2.cloudflarestorage.com
```

### 3.3 访问测试

浏览器打开：`https://cdn.taipi.top/img/tplogo2.png`

能正常显示图片即表示配置成功。

## 四、配置 CORS 策略

### 4.1 为什么需要 CORS？

CORS（跨域资源共享）用于控制脚本请求（如 JavaScript 的 fetch 或 XMLHttpRequest）对 R2 存储桶的跨域访问。虽然 `<img>` 标签加载图片不受 CORS 影响，但如果你需要通过脚本读取图片元数据、使用 Canvas 操作图片或进行上传操作，则需要配置。

### 4.2 配置步骤

1. 进入 R2 存储桶 → 设置 → CORS 策略
2. 点击 **编辑 CORS 策略**
3. 填入以下 JSON 配置：

```json
[
  {
    "AllowedOrigins": [
      "https://*.taipi.top",
      "https://taipi.top"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Cache-Control"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 4.3 配置项说明

| 字段 | 值 | 说明 |
| --- | --- | --- |
| AllowedOrigins | https://\*.taipi.top、https://taipi.top | 只允许 taipi.top 及子域名的脚本跨域访问 |
| AllowedMethods | GET、HEAD、PUT、POST、DELETE | 允许的 HTTP 方法 |
| AllowedHeaders | * | 允许所有请求头 |
| ExposeHeaders | ETag、Content-Length、Cache-Control | 允许前端 JavaScript 访问这些响应头 |
| MaxAgeSeconds | 3600 | 预检请求（OPTIONS）的缓存时间（1小时） |

### 4.4 ⚠️ 重要说明

**CORS 不限制图片显示！** 如果你只想限制其他网站通过 `<img>` 标签显示图片，CORS 无法实现，需要使用第 6 节的 WAF 防盗链规则。

## 五、.NET 程序 API 上传/删除操作

### 5.1 获取 R2 API 凭证

1. 登录 Cloudflare 控制台 → R2 → 管理 R2 API 令牌
2. 点击 **创建 API 令牌**
3. 选择权限（至少需要对象读、写、删除权限）
4. 保存生成的 Access Key ID 和 Secret Access Key

### 5.2 使用 NuGet 包（推荐）

Cloudflare R2 兼容 AWS S3 协议，可以使用 S3 兼容的 .NET SDK。推荐使用以下任一方案：

#### 方案一：使用 AWSSDK.S3（官方 AWS SDK）

安装 NuGet 包：

```bash
dotnet add package AWSSDK.S3
```

配置类：

```csharp
public class R2Options
{
    public string BucketName { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string AccountId { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty; // https://cdn.taipi.top
}
```

配置文件（appsettings.json）：

```json
{
  "R2Options": {
    "BucketName": "taipi-img",
    "AccessKeyId": "你的 Access Key ID",
    "SecretAccessKey": "你的 Secret Access Key",
    "AccountId": "你的 Cloudflare 账号 ID",
    "PublicUrl": "https://cdn.taipi.top"
  }
}
```

S3 客户端注册（Program.cs）：

```csharp title="Program.cs"
using Amazon;
using Amazon.S3;
using Amazon.Runtime;

builder.Services.Configure<R2Options>(
    builder.Configuration.GetSection("R2Options"));

builder.Services.AddSingleton<IAmazonS3>(provider =>
{
    var options = provider.GetRequiredService<IOptions<R2Options>>().Value;
    
    var config = new AmazonS3Config
    {
        ServiceURL = $"https://{options.AccountId}.r2.cloudflarestorage.com",
        ForcePathStyle = true,  // R2 要求使用路径式寻址
        AuthenticationRegion = "auto",
        UseHttp = false
    };
    
    var credentials = new BasicAWSCredentials(options.AccessKeyId, options.SecretAccessKey);
    return new AmazonS3Client(credentials, config);
});
```

上传与删除服务：

```csharp title="R2ImageService.cs"
public interface IR2ImageService
{
    Task<string> UploadImageAsync(IFormFile file, string folder = "img");
    Task<bool> DeleteImageAsync(string imageUrl);
}

public class R2ImageService : IR2ImageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly IOptions<R2Options> _options;

    public R2ImageService(IAmazonS3 s3Client, IOptions<R2Options> options)
    {
        _s3Client = s3Client;
        _options = options;
    }

    // 上传图片
    public async Task<string> UploadImageAsync(IFormFile file, string folder = "img")
    {
        // 生成唯一文件名
        var extension = Path.GetExtension(file.FileName);
        var key = $"{folder}/{Guid.NewGuid()}{extension}";

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        
        var request = new PutObjectRequest
        {
            BucketName = _options.Value.BucketName,
            Key = key,
            InputStream = memoryStream,
            ContentType = file.ContentType,
            DisablePayloadSigning = true,      // R2 必需
            DisableDefaultChecksumValidation = true // R2 必需
        };

        var response = await _s3Client.PutObjectAsync(request);
        
        if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
        {
            return $"{_options.Value.PublicUrl}/{key}";
        }
        
        throw new Exception("上传失败");
    }

    // 删除图片
    public async Task<bool> DeleteImageAsync(string imageUrl)
    {
        // 从 URL 中提取 key（例如：https://cdn.taipi.top/img/xxx.png -> img/xxx.png）
        var uri = new Uri(imageUrl);
        var key = uri.AbsolutePath.TrimStart('/');

        var request = new DeleteObjectRequest
        {
            BucketName = _options.Value.BucketName,
            Key = key
        };

        var response = await _s3Client.DeleteObjectAsync(request);
        return response.HttpStatusCode == System.Net.HttpStatusCode.NoContent;
    }
}
```

API 控制器示例：

```csharp title="ImageController.cs"
[ApiController]
[Route("api/[controller]")]
public class ImageController : ControllerBase
{
    private readonly IR2ImageService _imageService;

    public ImageController(IR2ImageService imageService)
    {
        _imageService = imageService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        // 限制文件类型
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest("不支持的文件类型");

        // 限制文件大小（5MB）
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("文件大小不能超过 5MB");

        try
        {
            var url = await _imageService.UploadImageAsync(file);
            return Ok(new { url, success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("delete")]
    public async Task<IActionResult> Delete([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
            return BadRequest("请提供图片 URL");

        try
        {
            var result = await _imageService.DeleteImageAsync(url);
            if (result)
                return Ok(new { success = true });
            else
                return NotFound(new { error = "图片不存在" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
```

#### 方案二：使用第三方轻量库（Scsl.S3）

安装 NuGet 包：

```bash
dotnet add package Scsl.S3
```

使用示例：

```csharp
using Scsl.S3;

// 注册服务
builder.Services.Configure<R2Options>(builder.Configuration.GetSection("R2Options"));
builder.Services.AddScoped<IR2Client, R2Client>();

// 上传
public async Task<IActionResult> PutObject(FileUploadFromModel file)
{
    using var stream = new MemoryStream();
    await file.FormFile.CopyToAsync(stream);
    var result = await _client.PutObject(stream, _options.Value.BucketName, "img/filename.png");
    if(!result.Succeeded) return BadRequest(result.Errors);
    return Ok();
}

// 删除
public async Task<IActionResult> DeleteObject(string file)
{
    var result = await _client.DeleteObject(_options.Value.BucketName, file);
    if(!result.Succeeded) return BadRequest(result.Errors);
    return NoContent();
}
```

### 5.3 ⚠️ 重要配置说明

R2 与 AWS S3 的差异处理：

| 配置项 | 必要性 | 说明 |
| --- | --- | --- |
| ForcePathStyle = true | ✅ 必需 | R2 不支持虚拟主机式寻址 |
| DisablePayloadSigning = true | ✅ 必需 | 避免签名不匹配问题 |
| DisableDefaultChecksumValidation = true | ✅ 必需 | 禁用默认校验和验证 |
| AuthenticationRegion = "auto" | ✅ 必需 | R2 使用 auto 作为区域 |

如果遇到签名不匹配的错误（"The request signature we calculated does not match the signature you provided"），请确保已添加 `DisablePayloadSigning = true` 和 `DisableDefaultChecksumValidation = true` 配置。

## 六、配置防盗链 + 防直接访问（WAF 自定义规则）

### 6.1 需求说明

| 访问方式 | 预期结果 |
| --- | --- |
| taip.top 网站内显示 | ✅ 正常显示 |
| *.taipi.top 子域名显示 | ✅ 正常显示 |
| 其他网站嵌入 `<img src="...">` | ❌ 禁止显示 |
| 直接浏览器打开图片链接 | ❌ 禁止显示（返回 403） |

### 6.2 使用 WAF 自定义规则

步骤：

1. Cloudflare 控制台 → 域名 taipi.top
2. 左侧菜单 → 安全性 → WAF
3. 点击 **自定义规则** → 创建规则

规则配置：
- 规则名称：Block_Image_Hotlink_Direct
- 表达式：

```http title="表达式"
(http.request.uri.path contains "/img/") and (http.referer eq "" or not http.referer contains "taipi.top")
```

- 操作：阻止（Block）
- 响应代码：403

### 6.3 规则说明

| 条件 | 含义 |
| --- | --- |
| http.request.uri.path contains "/img/" | 只对 /img/ 路径下的文件生效 |
| http.referer eq "" | Referer 为空（直接访问） |
| not http.referer contains "taipi.top" | Referer 不包含你的域名 |

满足任一条件 → 触发阻止。

## 七、测试验证

### 7.1 正向测试（应该成功）

**测试 1：网站内显示**

```html
<img src="https://cdn.taipi.top/img/tplogo2.png" />
```

✅ 图片正常显示（Referer 包含 taipi.top）

**测试 2：脚本跨域请求（CORS）**

```javascript
fetch('https://cdn.taipi.top/img/tplogo2.png', { mode: 'cors' })
  .then(res => console.log('CORS 允许:', res.ok))
```

✅ 返回 true（Origin 在允许列表中）

**测试 3：.NET API 上传**

```csharp
// 调用你的 API
POST /api/image/upload
Content-Type: multipart/form-data
file: [选择图片]
```

✅ 返回图片 URL

### 7.2 反向测试（应该失败）

**测试 1：直接访问**

浏览器地址栏打开 `https://cdn.taipi.top/img/tplogo2.png`

预期结果：❌ 返回 403（Referer 为空）

**测试 2：其他网站盗链**

```html
<!-- 放在 http://localhost:3000 或其他非 taipi.top 域名 -->
<img src="https://cdn.taipi.top/img/tplogo2.png" />
```

预期结果：❌ 图片无法显示（Referer 不包含 taipi.top）

**测试 3：非允许来源的脚本请求**

```javascript
// 从 http://localhost:3000 执行
fetch('https://cdn.taipi.top/img/tplogo2.png', { mode: 'cors' })
```

预期结果：❌ CORS 错误（Origin 不在允许列表中）

## 八、完整配置清单

| 配置项 | 状态 | 位置 | 用途 |
| --- | --- | --- | --- |
| R2 存储桶 | ✅ 已创建 | Cloudflare R2 | 存储图片 |
| 自定义域名 | ✅ cdn.taipi.top | R2 → 自定义域名 | 图床访问地址 |
| CORS 策略 | ✅ 已配置 | R2 → CORS 策略 | 控制脚本跨域访问 |
| R2 API 令牌 | ✅ 已创建 | R2 → 管理 API 令牌 | .NET 程序调用凭证 |
| .NET 上传/删除服务 | ✅ 已实现 | 应用程序代码 | 程序化管理图片 |
| WAF 防盗链规则 | ✅ 已启用 | 安全性 → WAF | 控制 `<img>` 显示和直接访问 |

## 九、常见问题

### Q1: CORS 和 WAF 规则的区别是什么？

| 对比项 | CORS | WAF 规则 |
| --- | --- | --- |
| 控制对象 | 脚本请求（fetch/XHR） | 所有 HTTP 请求（包括 `<img>`） |
| 是否会阻止图片显示 | ❌ 不会 | ✅ 会 |
| 是否会阻止直接访问 | ❌ 不会 | ✅ 会 |
| 响应方式 | 返回 CORS 头，浏览器拦截 | 直接返回 403 |

**结论：** 两者互补，CORS 管脚本，WAF 管引用。

### Q2: .NET 上传时遇到签名不匹配错误怎么办？

确保在 `PutObjectRequest` 中添加了以下配置：

```csharp
DisablePayloadSigning = true,
DisableDefaultChecksumValidation = true
```

### Q3: 如何生成预签名 URL（临时访问链接）？

可以使用 `GetPreSignedURL` 方法生成有效期为 1 小时的临时链接：

```csharp
var request = new GetPreSignedUrlRequest
{
    BucketName = bucketName,
    Key = key,
    Expires = DateTime.UtcNow.AddHours(1)
};
var url = _s3Client.GetPreSignedURL(request);
```

### Q4: 微信/QQ 等内置浏览器无法显示图片？

这些应用的内置浏览器可能不发送 Referer，会被 WAF 规则拦截。如需支持，可以：

- 将特定 User-Agent 加入例外
- 或临时关闭 WAF 规则测试

### Q5: 会影响搜索引擎收录吗？

搜索引擎爬虫（Googlebot、Bingbot）会发送 Referer，不受影响。如需额外保障，可添加：

```http
and not http.user_agent contains "Googlebot"
```

## 十、成本说明

| 服务 | 费用 |
| --- | --- |
| Cloudflare R2 | 免费额度：10 GB 存储 + 每月 100 万次 A 类操作 + 1000 万次 B 类操作 |
| Cloudflare CDN | 免费（经 Cloudflare 代理的流量） |
| WAF 自定义规则 | 免费（含 5 条规则） |

对于个人/小型网站的图床需求，完全在免费额度内。

## 十一、总结

通过以上配置，我们实现了：

✅ R2 对象存储 + 自定义域名 cdn.taipi.top 搭建图床  
✅ Cloudflare CDN 加速图片访问  
✅ CORS 策略：控制脚本跨域访问，仅允许 taipi.top 及子域名  
✅ .NET API：支持程序化上传、删除图片  
✅ WAF 自定义规则：实现"防盗链 + 防直接访问"  
✅ 仅允许 taipi.top 及其子域名通过 `<img>` 显示图片  
✅ 直接访问图片链接返回 403  
✅ 双重防护：CORS（脚本层）+ WAF（资源层）

这套方案成本低、配置清晰、功能完整，支持程序化管理，适合个人开发者和小型项目使用。
