# 第 13 步：预约详情与履约记录

## 本次目标

把预约模块从“能建单、能流转状态”继续往前推进一步，补上：

- 预约详情页
- 履约记录（VisitRecord）

做到这一步后，你的预约链路就不只是“列表里点几下按钮变状态”，而是能真正承接门店到店后的服务记录。

## 这一步做了什么

本轮新增/修改了这些核心文件：

```text
src/lib/validations/appointment.ts
src/app/(dashboard)/appointments/actions.ts
src/components/appointments/visit-record-form.tsx
src/app/(dashboard)/appointments/[id]/page.tsx
src/app/(dashboard)/appointments/page.tsx
```

## 新增能力

### 1. 预约详情页

现在每条预约都可以点进详情页，查看：

- 客户信息
- 宠物信息
- 服务项目
- 预约开始/结束时间
- 指派员工
- 预约备注

### 2. 履约记录表单

当预约状态进入：

- `IN_SERVICE`
- `COMPLETED`

详情页会开放履约记录编辑，可以填写：

- 实际服务名称
- 实际金额
- 履约员工
- 服务记录
- 宠物状态备注
- 下次建议到店日期

### 3. 状态推进时自动创建 VisitRecord

这一轮把“状态流转”和“履约记录”连起来了：

- `CONFIRMED -> IN_SERVICE` 时，自动补 `checkInAt`
- `IN_SERVICE -> COMPLETED` 时，自动补 `completedAt`

如果当前预约还没有 `VisitRecord`，系统会自动创建一条。

也就是说，`VisitRecord` 不再是孤立表，而是真正挂在预约状态机后面。

## 为什么这样做

## 1. 为什么先做详情页，而不是先做日历？

因为详情页直接承接业务数据：

- 这次到底做了什么服务
- 实际收了多少钱
- 宠物当时状态怎么样
- 下次应该什么时候回店

这些信息都比“日历长什么样”更接近真实门店系统的核心价值。

## 2. 为什么把 VisitRecord 挂在 Appointment 上？

数据库模型里本来就是一对一：

- 一个预约
- 对应一条履约记录

这很符合业务直觉：

- 预约是“计划”
- 履约记录是“实际发生了什么”

所以详情页天然就是这两部分信息并排展示的最佳位置。

## 3. 为什么状态推进时自动补时间，而不是让用户手填？

因为 `checkInAt` 和 `completedAt` 更像系统行为时间戳。

如果让用户手填：

- 容易忘填
- 容易填错
- 联调会很麻烦

先让系统自动记录，后面如果真有需要，再补“手动修正时间”的能力也不迟。

## 关键文件说明

### `src/lib/validations/appointment.ts`

除了原来的预约表单校验，这里新增了 `visitRecordFormSchema`。

这让履约表单也走统一的 Zod 校验，不会把脏数据直接写进数据库。

### `src/app/(dashboard)/appointments/actions.ts`

这一轮最关键的增强都在这里：

1. `advanceAppointmentStatusAction`
   - 推状态时顺带自动创建/更新 `VisitRecord`
   - 进入服务中时补 `checkInAt`
   - 完成服务时补 `completedAt`

2. `saveVisitRecordAction`
   - 保存详情页里的履约记录表单
   - 会校验员工是否合法
   - 会刷新预约列表、预约详情、客户详情

### `src/app/(dashboard)/appointments/[id]/page.tsx`

这是新加的预约详情页。

页面分成两部分：

- 左边：预约基础信息 + 履约记录摘要
- 右边：当前状态 + 履约记录表单

这样结构很适合中后台场景，也方便你后面继续往里加“发券建议”“回访提醒”等内容。

### `src/components/appointments/visit-record-form.tsx`

这里单独抽了一个表单组件，原因是履约记录本身已经是一块完整业务。

单独拆出来有两个好处：

- 详情页不会变得太臃肿
- 以后如果要做抽屉编辑或弹窗编辑，可以直接复用

## 你自己如何复现

如果你要自己手做一遍，建议顺序是：

1. 在 `appointment.ts` 增加 `visitRecordFormSchema`
2. 在 `appointments/actions.ts` 里补：
   - `saveVisitRecordAction`
   - 状态推进时自动 upsert `VisitRecord`
3. 新建 `VisitRecordForm`
4. 新建 `/appointments/[id]/page.tsx`
5. 回到预约列表页，把预约编号或按钮链接到详情页

## 验证方式

建议这样测：

1. 新建一条预约
2. 在列表页把状态推进到 `已确认`
3. 再推进到 `服务中`
4. 打开详情页，确认是否已经出现履约记录表单
5. 填写服务记录并保存
6. 再把状态推进到 `已完成`
7. 回到详情页确认 `completedAt` 是否已经自动生成

## 容易踩坑的点

1. **不要只更新预约状态，不更新 VisitRecord**
   否则你会看到状态变成“服务中/已完成”，但详情页里没有任何履约信息，数据会割裂。

2. **Decimal 传到页面前要转普通值**
   Prisma 的 Decimal 在前端使用时要小心，当前页面里都做了显式转换，避免序列化和展示问题。

3. **不是所有状态都应该开放履约表单**
   当前只在 `IN_SERVICE` 和 `COMPLETED` 开放，避免用户在预约还没开始时就乱填服务记录。

## 做完以后项目状态

到这一步，你的核心业务链已经变成：

1. 维护服务项目
2. 维护客户和宠物
3. 创建预约
4. 推进预约状态
5. 填写履约记录

这已经比普通学生项目里常见的“只有 CRUD 页面”更像一个真实业务系统了。
