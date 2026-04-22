# 第 22 步：后端安全与性能加固

## 本次目标

梳理并修复所有 Server Action 和数据库查询中的安全隐患与性能问题，让代码达到"可上生产"的标准。

---

## 问题清单与修复

### 1. Zod 从 `parse` 改为 `safeParse`（一致性改造）

原来的写法直接 `schema.parse(data)`，Zod 抛出的异常会被 Next.js 捕获后显示成一个通用的错误页面，用户体验差。

**改造后**：所有 Action 都通过同一个工具函数处理：

```ts
function parseFormDataSafe<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    // 把多个校验错误拼成一句话，直接 throw，由 error boundary 捕获
    throw new Error(result.error.issues.map((e) => e.message).join("；"));
  }
  return result.data;
}
```

注意用 `.issues`（Zod 的正式 API），不是 `.errors`。

---

### 2. 唯一约束违反（P2002）的友好处理

客户手机号有 `@unique` 约束，重复录入时 Prisma 会抛 P2002 错误。  
原来直接 500，现在捕获后返回用户能看懂的提示：

```ts
function isPrismaUniqueError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

// createCustomerAction 内
try {
  await prisma.customer.create({ data });
} catch (err) {
  if (isPrismaUniqueError(err)) throw new Error("该手机号已存在，请检查是否重复录入。");
  throw err;
}
```

---

### 3. 宠物归属权校验

`updatePetAction` 原来只靠 `petId` 更新，任何知道 `petId` 的人都能修改别人的宠物数据。

**修复**：改用 `updateMany` + 双条件，同时验证 `petId` 和 `customerId`：

```ts
const updated = await prisma.pet.updateMany({
  where: { id: petId, customerId }, // 两个条件都要满足
  data: { /* ... */ },
});
if (updated.count === 0) throw new Error("宠物不存在或无权修改。");
```

`updateMany` 返回 `{ count: number }`，count 为 0 说明记录不存在或不属于该客户。

---

### 4. 预约号并发安全

原来用 `count + 1` 生成序号，高并发下会产生重复。  
**改用随机后缀**，碰撞概率降到几乎为零：

```ts
function buildAppointmentNo(scheduledDate: Date): string {
  const prefix = `APT-${format(scheduledDate, "yyyyMMdd")}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去掉易混淆字符
  const suffix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `${prefix}-${suffix}`; // e.g. APT-20260422-K7NP
}
```

字符集排除了 `0/O/1/I/L` 等容易混淆的字符，方便人工核对。

---

### 5. 全表扫描优化

| 位置 | 原来 | 优化后 |
|------|------|--------|
| `dashboard/page.tsx` 沉睡客户数 | `findMany` 全量 + JS `filter` | `prisma.customer.count({ where: { NOT: { appointments: … } } })` |
| `operations/page.tsx` 沉睡客户列表 | 全量 `findMany` | 带 `where` 条件的 `findMany` + `take: 30` |
| `customers/page.tsx` | 无上限 | `take: 100` |
| `appointments/page.tsx` 列表模式 | 无上限 | `take: 100`（搜索时解除限制） |

核心原则：**让数据库做筛选，不要把数据拉到 Node 层再过滤**。

---

### 6. StoreProfile 新增 Zod Schema

门店设置页原来没有表单校验，直接把 `FormData` 扔给 Prisma。  
新增 `src/lib/validations/store-profile.ts`：

```ts
export const storeProfileSchema = z.object({
  name: z.string().trim().min(1, "门店名称不能为空").max(50),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(100).optional(),
  businessHours: z.string().trim().max(50).optional(),
  description: z.string().trim().max(500).optional(),
});
```

---

## 总结

本步所有修改都没有改动 API 接口或数据结构，属于**防御性重构**：

- 安全：防止越权修改他人数据
- 健壮：优雅处理唯一约束冲突、并发竞争
- 性能：消除不必要的全表扫描
- 可维护：统一的表单校验模式，降低后续踩坑概率
