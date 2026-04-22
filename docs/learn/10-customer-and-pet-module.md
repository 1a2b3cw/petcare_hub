# 第 10 步：客户与宠物档案模块落地

## 本次目标

把第二条业务主线落地：**客户档案 + 宠物档案**。

做完这一步以后，系统里应该能做到：

- 在 `/customers` 看到数据库里真实的客户列表
- 点击进入任意客户的详情页，看到他的宠物档案和最近预约
- 新增客户 / 编辑客户
- 为某个客户新增宠物 / 编辑宠物

这一步是预约模块的前置条件。因为一条预约记录必须绑定一个“已存在的客户 + 已存在的宠物 + 已存在的服务项目”，所以必须先把客户和宠物这两块真实数据跑通，预约模块才有东西可选。

## 我做了什么

这一轮新增了这些文件：

```
src/lib/validations/
  customer.ts                         # 客户表单 Zod 校验
  pet.ts                              # 宠物表单 Zod 校验 + 下拉选项
src/components/
  customers/customer-form.tsx         # 客户新增/编辑共用表单
  pets/pet-form.tsx                   # 宠物新增/编辑共用表单
src/app/(dashboard)/customers/
  actions.ts                          # 客户和宠物的 Server Actions
  page.tsx                            # 客户列表（改为真实数据）
  new/page.tsx                        # 新增客户
  [id]/page.tsx                       # 客户详情（含宠物列表+最近预约）
  [id]/edit/page.tsx                  # 编辑客户
  [id]/pets/new/page.tsx              # 某客户下新增宠物
  [id]/pets/[petId]/edit/page.tsx     # 某客户下编辑宠物
```

以及 `src/app/(dashboard)/customers/page.tsx` 从 mock 数据改成了 Prisma 查询。

## 为什么这样做

### 1. 为什么先做客户/宠物，再做预约？

预约模块需要同时选客户、宠物、服务。如果这时候客户和宠物都还是 mock 数据，预约做出来也只是空壳。

先把“客户 - 宠物”这条上游建好，预约模块就能直接用 `findMany` 拉下拉列表，不需要再回头改数据结构。

### 2. 为什么宠物和客户写在同一个 actions 文件里？

宠物是客户的子资源，业务上几乎永远成对出现：

- 不会脱离客户单独列出全部宠物
- 不会脱离客户新增一只“无主宠物”

所以 `customers/actions.ts` 同时对外暴露：

- `createCustomerAction` / `updateCustomerAction`
- `createPetAction` / `updatePetAction`

这样模块边界和业务认知一致，后续维护也只需要改一个文件。

### 3. 为什么宠物页面放在 `customers/[id]/pets/...` 下？

因为路径本身就在表达“这只宠物属于哪位客户”。这么做有两个好处：

- 详情页面包屑逻辑很自然（客户列表 → 客户详情 → 编辑宠物）
- Server Action 拿 `customerId` 时直接从路由参数里取，不需要再查一次数据库

### 4. 为什么依然用 Server Actions 而不是 API Route？

和服务模块一样的原因：

- 表单提交天然走原生 `form action`，代码最少
- `revalidatePath` + `redirect` 两行就能完成“刷新缓存并跳转”
- 学习成本低，简历上也好讲清楚“服务端动作怎么用”

### 5. 列表页为什么带 `include`？

为了一次把“这个客户有几只宠物 / 最近一次完成服务是什么时候”都拿出来，避免在 React 组件里再额外发一堆请求。

这属于 Prisma 非常典型的用法——**在查询层直接构造出前端要展示的视图**，不要把“拼接视图”的责任下放到组件里。

## 关键文件说明

### `src/lib/validations/customer.ts` 和 `pet.ts`

所有校验规则放在这里，前端表单和 Server Action **共享同一份 schema**。

宠物这里额外导出了 `petTypeOptions` / `petGenderOptions` / `petSizeOptions` 三个 `as const` 选项表。好处是：

- 表单下拉直接 `.map` 就能渲染
- 详情页展示时可以用同一份选项表把枚举值（`DOG`）翻译成中文（`狗狗`）

枚举的“值来源”只有一处，不会出现前端文案和数据库枚举对不上的问题。

### `src/components/customers/customer-form.tsx` / `pets/pet-form.tsx`

同一个表单组件同时服务于“新增”和“编辑”：

- 通过 `action` 接收外部传入的 Server Action
- 通过 `defaultValues` 控制回显
- 通过 `submitText` / `pendingText` 控制按钮文案

调用方传参决定它是新增还是编辑，表单本身不关心。

这是一个非常常用、也非常值得写进简历的 React 模式：**同一份 UI 配合不同的 Action 和默认值，复用整个表单。**

### `src/app/(dashboard)/customers/actions.ts`

所有 Server Action 的共同结构都是：

1. 从 `FormData` 里读取字段
2. 交给 Zod schema `parse`
3. 调 Prisma 写库
4. `revalidatePath` + `redirect`

宠物相关的 action 额外接受一个 `customerId` 参数，用 `.bind(null, customer.id)` 在页面上预绑定，这样表单里就不需要再塞一个 `<input type="hidden" name="customerId">` 这种半脏做法。

### `src/app/(dashboard)/customers/[id]/page.tsx`

这是这一步最有工程价值的页面，它一次完成了三件事：

- 展示客户基础信息
- 展示所有宠物卡片（含体型、性别、健康备注等）
- 展示这位客户最近 5 条预约

最近预约部分当前表里可能还没有数据，但页面已经预留好位置，等预约模块跑通之后就会自动显示。**不用等预约模块完成再来返工详情页。**

## 你自己如何复现

想从零做这一步，只要按顺序做这几件事：

1. **先写校验**
   - 在 `src/lib/validations/` 下新建 `customer.ts` 和 `pet.ts`
   - 宠物那边把三组选项 (`type / gender / size`) 导出成 `as const` 数组

2. **再写 Server Actions**
   - 新建 `src/app/(dashboard)/customers/actions.ts`
   - 顶部加 `"use server"`
   - 分别写 `createCustomerAction` / `updateCustomerAction` / `createPetAction` / `updatePetAction`
   - 每个 action 的 4 步固定套路：`parse → prisma → revalidatePath → redirect`

3. **再写表单组件**
   - 新建 `customer-form.tsx` 和 `pet-form.tsx`
   - 保持“同一份表单用于新增和编辑”的模式
   - 宠物表单里的下拉用 `petTypeOptions` 等直接 `map`

4. **最后补页面**
   - 改 `/customers/page.tsx`：mock → `prisma.customer.findMany`
   - 加 `/customers/new/page.tsx`：渲染 `CustomerForm`，绑定 `createCustomerAction`
   - 加 `/customers/[id]/page.tsx`：展示客户 + 宠物 + 最近预约
   - 加 `/customers/[id]/edit/page.tsx`：绑定 `updateCustomerAction.bind(null, id)`
   - 加 `/customers/[id]/pets/new/page.tsx`：绑定 `createPetAction.bind(null, id)`
   - 加 `/customers/[id]/pets/[petId]/edit/page.tsx`：绑定 `updatePetAction.bind(null, id, petId)`

5. **本地联调**
   ```powershell
   npm run dev
   ```
   - 进 `/customers`，点“新增客户”
   - 进任意客户详情，点“新增宠物”
   - 编辑一次客户，编辑一次宠物，观察列表和详情是否及时刷新

## 容易踩坑的点

1. **动态路由 params 是 Promise**
   Next.js 16 起，`page.tsx` 的 `params` 需要 `await` 才能拿到值：
   ```ts
   const { id } = await params;
   ```
   这里几个详情页和编辑页都已经按这种写法写了，别 copy 老版本写成 `params.id`。

2. **`action.bind(null, id)` 一定要加 `null`**
   第一个参数是 `this`，Server Action 不关心 this，但 TS 要求占位。如果漏掉 `null`，`customerId` 会变成 `this`，运行时会拿到错的 customer。

3. **手机号字段唯一性**
   Schema 里 `phone` 是 `@unique`。前端没做前置去重检查，实际开发中可以再加：
   - 表单提交之前先 `findUnique({ where: { phone } })`
   - 或者捕获 Prisma 的 `P2002` 错误给一个友好提示
   现在先让它报错，知道约束在就行。

4. **`revalidatePath` 范围**
   改客户信息时，记得同时 `revalidatePath("/customers")` 和 `revalidatePath(/customers/${id})`，否则详情页会继续显示旧数据。
   actions.ts 里已经处理了，复现的时候别漏。

5. **删除按钮的取舍**
   这一步没加“删除客户 / 删除宠物”。原因是：
   - 客户和宠物在真实业务里**应该软删除**（因为可能已经有历史预约挂在上面）
   - 硬删除会触发 Prisma 的 `Restrict` 外键策略，直接报错
   后续可以专门做一版软删除逻辑，现在先不做，避免误导。

## 做完以后状态应该是什么样

- `/customers` 列表里能看到种子数据里那位客户，并带有“1 只宠物”和最近一次完成服务的日期
- 点进去能看到“奶糕”这只比熊的档案
- 新增一个客户、给他加一只宠物，列表和详情都能即时刷新
- 刷新页面，数据不会丢（证明确实写进了数据库而不是内存）

做到这个样子，客户/宠物模块就算告一段落，可以去做第三条主线：**预约管理 + 状态流转**。
