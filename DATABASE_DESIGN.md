# 宠物洗护店预约与复购管理系统 - 数据库设计

## 1. 设计目标

这份数据库设计服务于项目的 MVP 版本，目标是：

1. 保证预约主链路完整
2. 保证客户、宠物、服务、预约、履约之间关系清晰
3. 控制复杂度，优先支持学生独立开发与上线
4. 为 Prisma Schema 和后续接口开发提供统一依据

当前设计以**单门店**为前提，不抽象多租户、不设计复杂财务模型、不接支付系统。

---

## 2. 设计原则

### 2.1 单门店优先

虽然表中保留了 `storeId` 这种可扩展思路，但 MVP 可以先默认只有一个门店实例，避免过早多租户设计。

### 2.2 围绕预约主链路

所有核心实体都围绕以下链路展开：

客户 -> 宠物 -> 服务项目 -> 预约 -> 履约记录 -> 优惠券/回访任务

### 2.3 历史数据可追踪

- 已被预约引用的服务项目不建议物理删除
- 已完成预约必须可追溯到客户、宠物、服务和履约记录
- 复购分析基于已完成服务数据

### 2.4 先做轻量，不做过度建模

- 不拆复杂配置表
- 枚举值优先固定
- 不建复杂日志审计系统
- 不引入库存、支付、分账、绩效等无关模块

---

## 3. 实体总览

MVP 核心实体如下：

1. `User`：系统登录账号
2. `StoreProfile`：门店基础信息
3. `ServiceItem`：服务项目
4. `Customer`：客户档案
5. `Pet`：宠物档案
6. `Appointment`：预约主表
7. `VisitRecord`：履约记录
8. `Coupon`：优惠券
9. `FollowUpTask`：回访任务

---

## 4. 表设计明细

## 4.1 User

### 作用
存储门店后台登录账号，用于权限和操作归属。

### 关键字段

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

### 说明

- `role` 取值为 `OWNER` / `STAFF`
- 使用 Credentials 登录时可直接保存密码哈希
- 如果后续接 NextAuth 官方表，也可以扩展 `Account` / `Session`

---

## 4.2 StoreProfile

### 作用
存储单门店基础资料。

### 关键字段

- `id`
- `name`
- `phone`
- `address`
- `businessHours`
- `description`
- `createdAt`
- `updatedAt`

### 说明

- MVP 可只保留一条门店记录
- `businessHours` 可以先用字符串存储，如 `09:00-20:00`

---

## 4.3 ServiceItem

### 作用
存储可被预约的服务项目。

### 关键字段

- `id`
- `name`
- `category`
- `durationMinutes`
- `price`
- `petTypeScope`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

### 说明

- `category` 可先简单枚举：`BATH` / `GROOMING` / `CARE`
- `petTypeScope` 取值：`DOG` / `CAT` / `ALL`
- 停用后不可创建新预约，但历史记录仍保留

---

## 4.4 Customer

### 作用
存储客户资料，是预约和复购运营的主体。

### 关键字段

- `id`
- `name`
- `phone`
- `wechat`
- `note`
- `createdAt`
- `updatedAt`

### 说明

- 手机号建议唯一
- 后续“新客/老客/高频客户”可以通过计算得出，MVP 不急着单独建标签体系

---

## 4.5 Pet

### 作用
存储宠物档案，归属某个客户。

### 关键字段

- `id`
- `customerId`
- `name`
- `type`
- `breed`
- `gender`
- `birthday`
- `ageText`
- `size`
- `coatCondition`
- `healthNote`
- `temperamentNote`
- `createdAt`
- `updatedAt`

### 说明

- `customerId` 必填
- `birthday` 和 `ageText` 二选一即可，不强行精确
- `type` 先支持 `DOG` / `CAT`

---

## 4.6 Appointment

### 作用
预约主表，是整个系统的核心。

### 关键字段

- `id`
- `appointmentNo`
- `customerId`
- `petId`
- `serviceItemId`
- `staffId`
- `scheduledDate`
- `startTime`
- `endTime`
- `status`
- `remark`
- `cancelReason`
- `createdAt`
- `updatedAt`

### 说明

- `appointmentNo` 用于列表展示和检索
- `staffId` 可为空，表示尚未指派
- `scheduledDate` 存日期，`startTime` / `endTime` 存完整时间
- `status` 是状态流转核心字段

### 状态枚举

- `PENDING`
- `CONFIRMED`
- `IN_SERVICE`
- `COMPLETED`
- `CANCELLED`

---

## 4.7 VisitRecord

### 作用
记录实际到店和服务完成情况。

### 关键字段

- `id`
- `appointmentId`
- `actualServiceName`
- `actualAmount`
- `staffId`
- `checkInAt`
- `completedAt`
- `serviceNote`
- `petConditionNote`
- `nextSuggestedVisitAt`
- `createdAt`
- `updatedAt`

### 说明

- 一条已完成预约对应一条履约记录
- 允许 `actualServiceName` 与服务项目名称不同，以反映实际服务情况

---

## 4.8 Coupon

### 作用
存储门店发给客户的优惠券。

### 关键字段

- `id`
- `customerId`
- `title`
- `type`
- `value`
- `minSpend`
- `status`
- `validFrom`
- `validUntil`
- `note`
- `createdAt`
- `updatedAt`

### 说明

- `type` 可先支持 `CASH` / `DISCOUNT`
- `status` 可先支持 `UNUSED` / `USED` / `EXPIRED`
- 只做记录，不对接支付核销

---

## 4.9 FollowUpTask

### 作用
记录待回访客户和回访结果，用于复购运营。

### 关键字段

- `id`
- `customerId`
- `petId`
- `sourceVisitRecordId`
- `dueDate`
- `status`
- `note`
- `completedAt`
- `createdAt`
- `updatedAt`

### 说明

- 可以由履约记录衍生
- `petId` 可为空，因为有些回访针对客户整体
- `status` 可先支持 `PENDING` / `DONE` / `SKIPPED`

---

## 5. 实体关系

### 5.1 一对多关系

- 一个 `Customer` 对应多只 `Pet`
- 一个 `Customer` 对应多条 `Appointment`
- 一个 `Pet` 对应多条 `Appointment`
- 一个 `ServiceItem` 对应多条 `Appointment`
- 一个 `User`（店员/美容师）可被分配到多条 `Appointment`
- 一个 `Customer` 可拥有多张 `Coupon`
- 一个 `Customer` 可拥有多条 `FollowUpTask`

### 5.2 一对一关系

- 一个 `Appointment` 最多对应一条 `VisitRecord`

---

## 6. 索引建议

为了保证列表查询和筛选体验，建议添加如下索引：

### Appointment

- `appointmentNo`
- `scheduledDate`
- `status`
- `staffId`
- `(scheduledDate, status)`

### Customer

- `phone`
- `name`

### Pet

- `customerId`
- `name`

### Coupon

- `customerId`
- `status`
- `validUntil`

### FollowUpTask

- `customerId`
- `status`
- `dueDate`

---

## 7. 关键业务约束

### 7.1 服务项目约束

- 已停用服务不可用于新预约
- 已存在历史预约的服务不建议物理删除

### 7.2 客户与宠物约束

- 宠物必须归属某个客户
- 预约时所选宠物必须属于所选客户

### 7.3 预约约束

- 创建预约必须选择客户、宠物、服务、日期、开始时间
- `PENDING -> CONFIRMED -> IN_SERVICE -> COMPLETED` 为主流程
- `CANCELLED` 为终止状态

### 7.4 履约约束

- 只有 `COMPLETED` 预约可生成 `VisitRecord`
- 每个预约最多对应一个履约记录

---

## 8. Prisma 建模建议

### 8.1 是否接入 NextAuth 官方表

有两种方案：

#### 方案 A：先自己做 Credentials 登录

优点：

- 上手更快
- 表更少，更适合学生项目起步

缺点：

- 和官方 Auth.js 适配器表结构不完全一致

#### 方案 B：直接接入 Auth.js + Prisma Adapter

优点：

- 更贴近真实项目
- 简历更规范

缺点：

- 表结构更复杂，会多出 `Account`、`Session`、`VerificationToken`

### 当前建议

为了控制第一版复杂度，**Prisma 初稿先采用简化登录模型**。后续如果你决定正式接入 Auth.js + Prisma Adapter，我可以再帮你升级成官方表结构版本。

---

## 9. 推荐 Prisma 枚举

- `UserRole`
- `ServiceCategory`
- `PetType`
- `PetGender`
- `PetSize`
- `AppointmentStatus`
- `CouponType`
- `CouponStatus`
- `FollowUpStatus`

---

## 10. 后续开发映射

数据库设计落地后，可以直接映射到开发任务：

1. 先建 `User`、`StoreProfile`
2. 再建 `ServiceItem`
3. 再建 `Customer`、`Pet`
4. 再建 `Appointment`
5. 最后补 `VisitRecord`、`Coupon`、`FollowUpTask`

这样最符合“先主链路，后运营功能”的开发节奏。

---

## 11. 一句话结论

这套数据库设计的重点不是“大而全”，而是用最少的核心表支撑“预约创建、状态流转、履约沉淀、复购提醒”这条真实业务链，让项目既能完成、又能上线、还能在面试中讲清楚。
