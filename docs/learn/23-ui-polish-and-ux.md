# 第 23 步：前端体验全面升级

## 本次目标

把所有页面的视觉风格统一到 shadcn/ui 的设计系统，补齐缺失的 UX 细节（Toast 通知、搜索、骨架屏、错误边界、404 页面）。

---

## 一、表单样式统一

### 问题

早期表单用硬编码颜色 `border-slate-200 bg-white text-slate-700`，在暗色模式或品牌色变更时会"脱节"。

### 解决

全部改为 CSS 变量：

```tsx
// 统一的 input className
"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-1 focus:ring-ring"

// 必填标记
<label>姓名 <span className="text-destructive">*</span></label>
```

CSS 变量（`--input`、`--background`、`--foreground` 等）由 shadcn/ui 的主题系统统一管理，切换主题时自动生效。

---

## 二、Toast 通知系统

### 架构

Server Action 无法直接调用客户端 API（如 `toast()`），解决方案是**通过 URL 传递状态**：

```
Server Action → redirect("/customers?success=created")
                              ↓
Client Component 读取 URL 参数 → 触发 toast → 清除 URL 参数
```

### 实现

**`src/components/common/search-param-toast.tsx`**：

```tsx
const successMessages: Record<string, string> = {
  created: "创建成功",
  updated: "修改已保存",
  deleted: "已删除",
  saved:   "保存成功",
  sent:    "发放成功",
};

function SearchParamToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const key = searchParams.get("success");
    if (!key) return;
    toast.success(successMessages[key] ?? "操作成功");
    // 清除 URL 参数，避免刷新重复弹出
    const next = new URLSearchParams(searchParams.toString());
    next.delete("success");
    router.replace(`${pathname}?${next.toString()}`.replace(/\?$/, ""));
  }, [searchParams]);
}
```

必须包在 `<Suspense>` 里（因为 `useSearchParams` 需要）：

```tsx
export function SearchParamToast() {
  return <Suspense fallback={null}><SearchParamToastInner /></Suspense>;
}
```

---

## 三、关键词搜索

### 客户搜索（`/customers?q=张`）

```ts
// Server Component 里直接在 DB 层过滤
where: q ? {
  OR: [
    { name:   { contains: q, mode: "insensitive" } },
    { phone:  { contains: q } },
    { wechat: { contains: q, mode: "insensitive" } },
  ],
} : undefined
```

### 预约搜索（`/appointments?q=APT`）

```ts
OR: [
  { appointmentNo: { contains: q, mode: "insensitive" } },
  { customer: { name: { contains: q, mode: "insensitive" } } },
  { pet:      { name: { contains: q, mode: "insensitive" } } },
]
```

### `SearchInput` 组件

```tsx
// src/components/common/search-input.tsx
export function SearchInput({ placeholder, className }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set("q", value) : params.delete("q");
    startTransition(() => router.replace(`${pathname}?${params}`));
  };
  // ...
}
```

`useTransition` 让搜索期间 UI 不被阻塞，`isPending` 可用于显示加载状态。

---

## 四、加载骨架屏（loading.tsx）

Next.js App Router 约定：`loading.tsx` 在同级 `page.tsx` 数据加载完成前自动显示。

```
(dashboard)/
├── loading.tsx          ← 通用布局骨架
├── dashboard/
│   └── loading.tsx      ← 工作台专用骨架
├── appointments/
│   └── loading.tsx      ← 预约表格骨架
└── customers/
    └── loading.tsx      ← 客户卡片网格骨架
```

骨架屏使用 shadcn 的 `<Skeleton>` 组件（本质是 `animate-pulse` + `bg-muted`），尽量模拟真实布局，减少"内容闪烁"的感知。

---

## 五、错误边界（error.tsx）

Next.js 约定：`error.tsx` 必须是 `"use client"` 组件（因为需要 `reset` 函数）。

```
app/
├── error.tsx            ← 全局兜底（globalError，需包含 <html><body>）
└── (dashboard)/
    └── error.tsx        ← 后台区域错误（复用 layout，只替换内容区）
```

```tsx
"use client";
export default function DashboardError({ error, reset }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card>
        <p>{error.message || "操作失败，请稍后重试。"}</p>
        <Button onClick={reset}>重试</Button>
        <Link href="/dashboard">回到工作台</Link>
      </Card>
    </div>
  );
}
```

`reset()` 会重新渲染该 segment，不需要整页刷新。

---

## 六、404 页面（not-found.tsx）

Next.js 约定：调用 `notFound()` 时，Next.js 会向上找最近的 `not-found.tsx`。

```
app/
├── not-found.tsx                        ← 全局 404
└── (dashboard)/
    ├── customers/[id]/not-found.tsx     ← 客户不存在
    └── appointments/[id]/not-found.tsx  ← 预约不存在
```

在 Server Component 里触发：

```ts
const customer = await prisma.customer.findUnique({ where: { id } });
if (!customer) notFound(); // Next.js 自动渲染最近的 not-found.tsx
```

---

## 七、侧边栏动态门店名

把门店名从数据库读取后通过 Props 传递，而不是硬编码：

```ts
// layout.tsx（Server Component）
const storeProfile = await prisma.storeProfile.findUnique(…);
return <AppShell storeName={storeProfile?.name}>{children}</AppShell>;

// AppSidebar（Client Component）
export function AppSidebar({ storeName }: { storeName?: string }) {
  return <p>{storeName ?? "PetCare Hub"}</p>; // 有值就显示真实名，否则降级
}
```

`?? "PetCare Hub"` 是空值合并（Nullish Coalescing），比 `|| "PetCare Hub"` 更严格：只在 `null` 或 `undefined` 时才用默认值。

---

## 收益总结

| 功能 | 之前 | 之后 |
|------|------|------|
| 表单操作反馈 | 无 | Toast 通知 |
| 搜索 | 无 | DB 层全文搜索 |
| 加载状态 | 白屏等待 | 骨架屏占位 |
| 意外错误 | Next.js 默认 500 页 | 带"重试"按钮的友好错误页 |
| 不存在的记录 | 500 错误 | 专属 404 页面 |
| 门店名 | 硬编码 | 从数据库读取 |
