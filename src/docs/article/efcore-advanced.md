---
layout: TutorialLayout
title: EF Core 高级实战：从性能调优到领域建模
date: 2026-06-08
category: tech
tags: .NET, EF Core, Entity Framework, 性能优化, 领域驱动, 并发控制, 仓储模式
summary: 深入 EF Core 高级用法：查询优化、并发控制、全局查询过滤器、拦截器、值对象映射、批量操作与仓储模式实战
---

## 一、查询性能：从 N+1 到零浪费

### 1.1 N+1 问题的本质

N+1 是 ORM 最常见的性能陷阱：1 次主查询 + N 次子查询，本该 1 条 SQL 完成的事变成了 N+1 条。

```csharp
// ❌ N+1：查 100 篇文章，就发 101 条 SQL
var posts = await _db.Posts.ToListAsync();           // 第 1 条：SELECT * FROM Posts
foreach (var post in posts)
{
    // 循环 100 次，每次 1 条 SQL
    var author = await _db.Users.FindAsync(post.AuthorId);  // 第 2~101 条：SELECT * FROM Users WHERE Id = @p0
}

// ✅ Eager Loading：1 条 SQL 用 JOIN 一次搞定
var posts = await _db.Posts
    .Include(p => p.Author)
    .ToListAsync();
// 生成：SELECT p.*, u.* FROM Posts p LEFT JOIN Users u ON p.AuthorId = u.Id
```

**更隐蔽的 N+1**——延迟加载（Lazy Loading）：

```csharp
// 即使不显式调用 Find，序列化或视图渲染时访问导航属性也会触发查询
var posts = await _db.Posts.AsNoTracking().ToListAsync();
return posts.Select(p => new PostDto
{
    Title = p.Title,
    AuthorName = p.Author!.Name  // ⚠️ 每次访问 p.Author 都触发 1 条 SQL
});
```

> **判断标准**：如果循环体内或属性访问时触发了数据库查询，几乎就是 N+1。解决方式只有两种——要么 Include 预加载，要么 Select 投影。

### 1.2 Select 投影：只取需要的列

```csharp
// ❌ 查出整行，浪费带宽和内存
var list = await _db.Products
    .Where(p => p.CategoryId == 1)
    .ToListAsync();

// ✅ 投影只取需要的字段，SQL 只 SELECT 指定列
var list = await _db.Products
    .Where(p => p.CategoryId == 1)
    .Select(p => new ProductDto
    {
        Id = p.Id,
        Name = p.Name,
        Price = p.Price
    })
    .ToListAsync();
```

### 1.3 Split Queries：拆分巨型 JOIN

当 Include 层级深时，JOIN 会产生笛卡尔爆炸：

```csharp
// ❌ 一个巨型 JOIN，行数膨胀严重
var blogs = await _db.Blogs
    .Include(b => b.Posts)
        .ThenInclude(p => p.Tags)
    .Include(b => b.Owner)
    .ToListAsync();

// ✅ 拆成多条 SQL，每条简单高效
var blogs = await _db.Blogs
    .Include(b => b.Posts)
        .ThenInclude(p => p.Tags)
    .Include(b => b.Owner)
    .AsSplitQuery()
    .ToListAsync();
```

### 1.4 编译查询：消除表达式树编译开销

```csharp
// 静态编译查询，只编译一次表达式树
private static readonly Func<AppDbContext, int, Task<User?>> _findUser =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Users.FirstOrDefault(u => u.Id == id));

// 使用时零编译开销
var user = await _findUser(_db, 42);
```

> 适合高频调用的简单查询（如缓存穿透时的兜底查询），低频查询无需使用。

### 1.5 NoTracking：只读场景必开

```csharp
// 全局默认 NoTracking
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder.UseSqlServer(_conn);
    ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
}

// 单次查询指定 NoTracking
var list = await _db.Users.AsNoTracking().ToListAsync();
```

全局 NoTracking 后，需要跟踪的查询用 `AsTracking()` 显式开启：

```csharp
// 全局 NoTracking，但这次需要跟踪（用于后续修改保存）
var user = await _db.Users
    .AsTracking()
    .FirstAsync(u => u.Id == 1);

user.Name = "新名字";
await _db.SaveChangesAsync();  // 没有跟踪就检测不到变更
```

> **推荐策略**：全局 NoTracking + 按需 AsTracking，比反过来更安全——大部分查询是只读的，漏开 NoTracking 代价远大于漏开 Tracking。

---

## 二、并发控制：乐观锁与悲观锁

### 2.1 乐观并发：ConcurrencyToken

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }

    // 并发令牌：EF 会把这个列加入 WHERE 条件
    [ConcurrencyCheck]
    public int Version { get; set; }
}

// 或用 FluentAPI 配置行版本号（SQL Server 自动递增）
modelBuilder.Entity<Product>()
    .Property(p => p.Version)
    .IsRowVersion();
```

处理冲突：

```csharp
try
{
    product.Price = 99.9m;
    await _db.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    // 策略一：客户端获胜（用当前值覆盖数据库）
    ex.Entries.Single().OriginalValues.SetValues(
        ex.Entries.Single().DatabaseValues!);

    // 策略二：数据库获胜（刷新当前实体）
    await ex.Entries.Single().ReloadAsync();

    // 策略三：合并（手动逐字段判断）
    var dbValues = await ex.Entries.Single().GetDatabaseValuesAsync();
    // ... 自定义合并逻辑
}
```

### 2.2 悲观并发：ForUpdate

```csharp
// PostgreSQL 的 SELECT FOR UPDATE
var account = await _db.Accounts
    .FromSqlRaw("SELECT * FROM Accounts WHERE Id = {0} FOR UPDATE", id)
    .SingleAsync();

account.Balance -= amount;
await _db.SaveChangesAsync();
```

> SQL Server 没有原生 `FOR UPDATE`，可以用事务隔离级别 `Serializable` 或 `UPDLOCK` 提示实现等效效果。

---

## 三、全局查询过滤器：软删除与多租户

### 3.1 软删除

```csharp
public abstract class SoftDeleteEntity
{
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

// 在 DbContext.OnModelCreating 中统一配置
foreach (var entityType in modelBuilder.Model.GetEntityTypes())
{
    if (typeof(SoftDeleteEntity).IsAssignableFrom(entityType.ClrType))
    {
        modelBuilder.Entity(entityType.ClrType)
            .HasQueryFilter(
                GenerateSoftDeleteFilter(entityType.ClrType));
    }
}

// 动态生成 Lambda：e => !e.IsDeleted
private static LambdaExpression GenerateSoftDeleteFilter(Type entityType)
{
    var param = Expression.Parameter(entityType, "e");
    var prop = Expression.Property(param, nameof(SoftDeleteEntity.IsDeleted));
    var filter = Expression.Lambda(Expression.Not(prop), param);
    return filter;
}
```

### 3.2 多租户

```csharp
// 通过 EF Core 的 QueryFilter 实现租户隔离
modelBuilder.Entity<Order>().HasQueryFilter(
    o => o.TenantId == _currentTenantId);

// 构造函数注入租户 ID
public class AppDbContext : DbContext
{
    private readonly string _currentTenantId;

    public AppDbContext(DbContextOptions options, ITenantProvider tenant)
        : base(options)
    {
        _currentTenantId = tenant.GetCurrentTenantId();
    }
}
```

### 3.3 绕过过滤器

```csharp
// 某些场景需要查已删除的数据（如回收站）
var deleted = await _db.Users
    .IgnoreQueryFilters()
    .Where(u => u.IsDeleted)
    .ToListAsync();
```

---

## 四、拦截器：SQL 级别的钩子

### 4.1 慢查询拦截器

```csharp
public class SlowQueryInterceptor : DbCommandInterceptor
{
    private readonly TimeSpan _threshold = TimeSpan.FromMilliseconds(500);

    public override DbDataReader ReaderExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result)
    {
        if (eventData.Duration > _threshold)
        {
            // 记录慢查询
            LogSlowQuery(command.CommandText, eventData.Duration);
        }
        return result;
    }

    public override ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken ct = default)
    {
        if (eventData.Duration > _threshold)
        {
            LogSlowQuery(command.CommandText, eventData.Duration);
        }
        return new ValueTask<DbDataReader>(result);
    }
}

// 注册
optionsBuilder.AddInterceptors(new SlowQueryInterceptor());
```

### 4.2 自动填充审计字段

```csharp
public class AuditInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        var entries = eventData.Context!.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is IAuditable auditable)
            {
                auditable.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    auditable.CreatedAt = DateTime.UtcNow;
            }
        }

        return base.SavingChanges(eventData, result);
    }
}
```

---

## 五、值对象映射：DDD 领域建模

### 5.1 Owned Entity 映射值对象

```csharp
// 值对象：没有独立标识，属于实体的一部分
public class Address
{
    public string Province { get; private set; } = "";
    public string City { get; private set; } = "";
    public string Detail { get; private set; } = "";

    // EF Core 需要无参构造函数
    private Address() { }

    public Address(string province, string city, string detail)
    {
        Province = province;
        City = city;
        Detail = detail;
    }
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public Address Address { get; set; } = null!;
}

// FluentAPI 配置
modelBuilder.Entity<User>(b =>
{
    b.OwnsOne(u => u.Address, a =>
    {
        a.Property(x => x.Province).HasColumnName("Province");
        a.Property(x => x.City).HasColumnName("City");
        a.Property(x => x.Detail).HasColumnName("Detail");
    });
});
```

### 5.2 值对象集合

```csharp
// EF Core 8+ 支持原始类型的集合
public class Order
{
    public int Id { get; set; }
    public List<string> Tags { get; set; } = [];
}

// 自动映射为 JSON 列（SQL Server / PostgreSQL）
modelBuilder.Entity<Order>()
    .Property(o => o.Tags)
    .HasColumnType("nvarchar(max)")  // SQL Server 用 JSON
    ;
```

---

## 六、批量操作：告别逐条 SaveChanges

### 6.1 ExecuteUpdate / ExecuteDelete（EF Core 7+）

```csharp
// ❌ 逐条更新：查出 → 修改 → 保存，3 步 N 条 SQL
var expired = await _db.Tokens
    .Where(t => t.ExpireAt < DateTime.UtcNow)
    .ToListAsync();
_db.Tokens.RemoveRange(expired);
await _db.SaveChangesAsync();

// ✅ 一条 SQL 直接删除
await _db.Tokens
    .Where(t => t.ExpireAt < DateTime.UtcNow)
    .ExecuteDeleteAsync();

// ✅ 一条 SQL 直接更新
await _db.Products
    .Where(p => p.CategoryId == 1)
    .ExecuteUpdateAsync(s => s
        .SetProperty(p => p.Price, p => p.Price * 0.9m)
        .SetProperty(p => p.UpdatedAt, DateTime.UtcNow));
```

> `ExecuteUpdate/ExecuteDelete` 直接在数据库执行，不经过 Change Tracker，性能极高。

### 6.2 大批量插入

EF Core 没有原生的 BulkInsert，推荐方案：

```csharp
// 方案一：EFCore.BulkExtensions（第三方库）
await _db.BulkInsertAsync(entities);

// 方案二：手动 SqlBulkCopy（SQL Server）
using var bulkCopy = new SqlBulkCopy(connection);
bulkCopy.DestinationTableName = "Products";
await bulkCopy.WriteToServerAsync(dataTable);
```

---

## 七、仓储模式：封装数据访问细节

### 7.1 泛型仓储

```csharp
public interface IRepository<TEntity> where TEntity : class
{
    Task<TEntity?> GetByIdAsync(int id);
    Task<List<TEntity>> ListAsync(ISpecification<TEntity> spec);
    Task AddAsync(TEntity entity);
    void Update(TEntity entity);
    void Remove(TEntity entity);
}

public class Repository<TEntity> : IRepository<TEntity>
    where TEntity : class
{
    protected readonly AppDbContext _db;
    protected readonly DbSet<TEntity> _set;

    public Repository(AppDbContext db)
    {
        _db = db;
        _set = db.Set<TEntity>();
    }

    public async Task<TEntity?> GetByIdAsync(int id) =>
        await _set.FindAsync(id);

    public async Task AddAsync(TEntity entity) =>
        await _set.AddAsync(entity);

    public void Update(TEntity entity) =>
        _set.Update(entity);

    public void Remove(TEntity entity) =>
        _set.Remove(entity);

    public async Task<List<TEntity>> ListAsync(ISpecification<TEntity> spec) =>
        await SpecificationEvaluator
            .GetQuery(_set, spec)
            .ToListAsync();
}
```

### 7.2 规约模式（Specification）

```csharp
// 规约：封装查询条件 + 排序 + Include
public class ActiveProductsByCategorySpec : Specification<Product>
{
    public ActiveProductsByCategorySpec(int categoryId)
    {
        Query.Where(p => p.CategoryId == categoryId && p.IsActive);
        Query.Include(p => p.Category);
        Query.OrderBy(p => p.Price);
        Query.AsNoTracking();
    }
}

// 使用
var products = await _repo.ListAsync(
    new ActiveProductsByCategorySpec(categoryId: 1));
```

---

## 八、实战技巧速查表

| 场景 | 方案 | 关键 API |
|------|------|---------|
| 只读查询 | NoTracking | `AsNoTracking()` |
| N+1 问题 | Eager Loading / 投影 | `Include()` / `Select()` |
| 巨型 JOIN 膨胀 | Split Query | `AsSplitQuery()` |
| 高频简单查询 | 编译查询 | `EF.CompileAsyncQuery()` |
| 并发冲突 | 乐观锁 | `[ConcurrencyCheck]` / `IsRowVersion()` |
| 软删除 | 全局过滤器 | `HasQueryFilter()` |
| 多租户隔离 | 全局过滤器 + 注入 | `HasQueryFilter()` |
| 慢查询监控 | 拦截器 | `DbCommandInterceptor` |
| 审计字段自动填充 | 拦截器 | `SaveChangesInterceptor` |
| 值对象映射 | Owned Entity | `OwnsOne()` / `OwnsMany()` |
| 批量删除/更新 | 直接执行 | `ExecuteDeleteAsync()` / `ExecuteUpdateAsync()` |
| 大批量插入 | BulkExtensions / SqlBulkCopy | `BulkInsertAsync()` |
| 查询条件复用 | 规约模式 | `Specification<T>` |

---

## 九、总结

EF Core 的高级用法核心围绕三个目标：

1. **性能**：NoTracking、投影、SplitQuery、编译查询、批量操作——减少不必要的开销
2. **正确性**：并发控制、全局过滤器——保证数据一致性和隔离性
3. **可维护性**：拦截器、值对象映射、仓储模式——让数据访问层干净可测试

掌握这些模式后，EF Core 不再是"慢 ORM"，而是能支撑企业级应用的高效数据访问层。
