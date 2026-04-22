# 第 20 步：经营报表页

## 本次目标

在现有业务数据的基础上，新增一个 `/reports` 路由，把门店最关心的经营指标汇总展示出来。

目标不是做一个"大数据仪表盘"，而是把已有的 `VisitRecord.actualAmount`、`Appointment`、`Customer`、`Coupon` 这些表里的数据，用肉眼能看懂的方式呈现出来。

## 我做了什么

```text
src/app/(dashboard)/reports/page.tsx   ← 新增
src/components/layout/app-shell.tsx    ← 补充"经营报表"导航项
docs/learn/README.md                   ← 更新目录
```

## 这一步新增了哪些能力

### 1. 本月核心指标（4 个卡片）

| 指标 | 数据来源 |
|------|----------|
| 本月收入 | `VisitRecord.actualAmount` 当月汇总 |
| 完成预约 | `Appointment.status = COMPLETED` 当月计数 |
| 新增客户 | `Customer.createdAt` 当月计数 |
| 活跃客户 | 近 30 天内有完成预约的客户数 / 总客户数 |

每个卡片还会对比上月数据，用 ↑/↓ 标注增减幅度。

### 2. 近 6 个月趋势（横向进度条）

- 收入趋势：绿色进度条，按月排列，最大月为满格基准
- 预约量趋势：蓝色进度条，逻辑同上

为什么用进度条而不是折线图？因为不引入第三方图表库，纯 CSS 实现，零额外依赖。

### 3. 热门服务 Top 5

统计近 3 个月内完成预约最多的服务项目，用 `groupBy + _count` 实现。

显示排名、服务名、单价、完成次数。前 3 名有颜色区分（金/银/铜）。

### 4. 优惠券使用概况

按 `status` 分组，展示：
- 未使用张数
- 已使用张数
- 已过期张数
- 总发放量和使用率

### 5. 近 6 个月新增客户柱状图

纯 CSS 竖向柱状图，不依赖任何图表库。

## 为什么这样做

### 1. 为什么现在做报表？

前 19 步把"交易闭环"做完了：预约 → 履约 → 回访 → 优惠券。这些交易过程已经在数据库里产生了足够的数据。

如果不做报表，这些数据就只是"存进去但看不到"。报表页的作用是让老板有理由每天打开这个后台。

### 2. 为什么不用 ECharts / Recharts？

有几个理由不引入图表库：

- 引入图表库意味着额外的包体积（ECharts 压缩后仍有 800KB+）
- 图表库通常是 Client Component，会影响首屏加载
- 当前数据量小，用 CSS 进度条已经足够表达趋势
- 简历项目不需要"看起来高大上"，需要"能说清楚技术决策"

如果未来数据量大了，或者需要交互式图表（hover 显示数值、缩放），再引入 Recharts 是合理的下一步。

### 3. 为什么月度趋势要用 6 个月？

6 个月是一个门店老板能感受到"季节性波动"的最小周期。

如果只看 1 个月，看不出趋势；如果看 12 个月，对于一个刚开业的门店来说数据太稀疏，反而没有说服力。

### 4. 为什么热门服务只看近 3 个月？

全量统计会让早期停用的服务排名靠前，不反映当前状况。3 个月是一个合理的"近期"窗口。

## 关键文件说明

### `src/app/(dashboard)/reports/page.tsx`

这是一个纯 Server Component，所有数据在服务端获取完再渲染。

关键 Prisma 查询：

```typescript
// 收入汇总
prisma.visitRecord.aggregate({
  _sum: { actualAmount: true },
  where: { completedAt: { gte: monthStart, lte: monthEnd } },
})

// 热门服务
prisma.appointment.groupBy({
  by: ["serviceItemId"],
  where: { status: "COMPLETED", scheduledDate: { gte: subMonths(now, 3) } },
  _count: { id: true },
  orderBy: { _count: { id: "desc" } },
  take: 5,
})

// 优惠券分布
prisma.coupon.groupBy({
  by: ["status"],
  _count: { id: true },
})
```

`StatCard` 是一个纯展示组件，接收 label / value / sub / growth 四个 props。

### `src/components/layout/app-shell.tsx`

新增了一条导航项：

```typescript
{ href: "/reports", label: "经营报表", description: "查看收入趋势与热门服务" },
```

`revalidate = 60` 意味着报表数据最多缓存 60 秒，比工作台的 30 秒略长，因为报表不需要实时性，更适合缓存。

## 你自己如何复现

1. 新建 `src/app/(dashboard)/reports/page.tsx`
2. 用 `startOfMonth / endOfMonth / subMonths` 算出当月和上月的时间区间
3. 用 `Promise.all` 并行发出所有查询（收入、预约、客户、优惠券、热门服务）
4. 用 CSS 进度条渲染趋势图
5. 在 `app-shell.tsx` 的 `sidebarItems` 里加一条
6. 验证：访问 `/reports`，看各区块数据是否正确

## 容易踩坑的点

### 1. `Decimal` 类型要转 `Number`

Prisma 的 `Decimal` 字段（如 `actualAmount`、`price`）在查询结果里是 Prisma 自己的 `Decimal` 类，不是 JS 原生 Number。

不处理直接传给 `toLocaleString` 会报错，必须先 `Number(...)` 转换。

### 2. `groupBy` 返回的 count 字段名

```typescript
// 写法 ✓
_count: { id: true }

// 访问时是
s._count.id  // 不是 s.count
```

### 3. 趋势图最大值基准要做保底

```typescript
const maxRevenue = Math.max(...monthlyTrend.map((m) => m.revenue), 1);
```

最后那个 `1` 是保底，避免全部月份收入为 0 时 `Math.max` 返回 `-Infinity`，导致除以 0 让进度条全部为 100%。

### 4. `revalidate` 不要设成 0

`revalidate = 0` 等于关掉缓存，每次请求都要重新查数据库，对 Neon 这种远程数据库来说延迟会非常明显。报表页设成 60 是合理的。

## 验证方式

1. 打开 `/reports`，看四个核心指标卡片是否有数据
2. 看近 6 个月趋势，进度条是否按比例显示
3. 看热门服务，是否能看到近 3 个月最多的服务
4. 看优惠券概况，总数和各状态数是否对上 `/operations` 里的数据

## 做完以后项目状态

现在项目具备了完整的业务闭环 + 数据可视化能力：

```
预约 → 履约 → 回访 → 优惠券 → 数据报表
```

这条线对一个宠物门店的老板来说是完整的：

- 看预约（预约管理）
- 做服务（履约记录）
- 跟进客户（复购运营）
- 发优惠（优惠券）
- 复盘经营（经营报表）

项目已经从"CRUD 演示"升级成了"有完整业务逻辑的 SaaS 原型"。
