# 07 第一次真正跑通数据库：本地 PostgreSQL 和 Neon 怎么选

## 本次目标

前面我们已经把工程骨架、Prisma 配置、数据模型和种子脚本都准备好了。  
但有一件事还没有真正完成：

**数据库还没有真的跑起来。**

这篇文档就是要帮你把项目从“已经写好了数据库相关代码”推进到“真的能连上数据库并把表建出来”。

---

## 你现在到底差哪一步

你当前项目里已经有这些东西：

- `prisma/schema.prisma`
- `prisma.config.ts`
- `.env`
- `prisma/seed.ts`

说明数据库相关代码层面已经基本齐了。  
你现在差的是：

1. 真的有一个 PostgreSQL 数据库
2. `DATABASE_URL` 指向它
3. 执行 Prisma 命令把表真正创建出来
4. 执行 seed，把演示数据真正写进去

简单说就是：

**代码准备好了，数据库环境还没真正落地。**

---

## 你有两条路可以选

当前最适合你的有两种方案：

### 方案 A：本地 PostgreSQL

适合你如果：

- 想练完整本地开发环境
- 不介意自己安装数据库
- 想更理解数据库工具链

### 方案 B：Neon 云数据库

适合你如果：

- 想更快开始
- 不想本地装 PostgreSQL
- 更看重“作品集后续上线方便”

---

## 我给你的推荐

如果你当前目标是：

- 尽快把项目继续做下去
- 后面还要部署上线
- 想把精力更多放在前端和业务开发

那我更推荐你优先用 **Neon**。

### 为什么

因为本地 PostgreSQL 虽然更完整，但会额外引入一批环境问题：

- 数据库安装
- 服务启动
- 端口占用
- 本机权限
- 工具连接问题

对你现在这个阶段来说，这些都不是最值得花时间的地方。

所以建议是：

- **优先 Neon 跑通开发**
- 以后你如果想补数据库环境能力，再回头装本地 PostgreSQL

---

## 方案 A：本地 PostgreSQL

## 第一步：安装 PostgreSQL

你需要先在电脑上安装 PostgreSQL。

安装完成后，你至少要知道这几个信息：

- 用户名
- 密码
- 端口（通常是 `5432`）

### 你最终想得到的连接串大概长这样

```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/petcare_hub?schema=public"
```

---

## 第二步：创建数据库

你需要新建一个数据库，例如：

```txt
petcare_hub
```

### 这一步你可以怎么做

通常有三种方式：

1. 用 pgAdmin 图形界面创建
2. 用命令行创建
3. 用其他数据库可视化工具创建

对初学者来说，图形界面通常更直观。

---

## 第三步：修改 `.env`

把 `DATABASE_URL` 改成你本地真实数据库的连接串。

比如：

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/petcare_hub?schema=public"
```

### 注意

密码必须和你本地 PostgreSQL 实际密码一致。  
如果这一步写错，后面 Prisma 连接一定会失败。

---

## 第四步：生成 Prisma Client

执行：

```bash
npm run prisma:generate
```

这一步主要是根据 schema 生成 Prisma Client。

---

## 第五步：真正创建表

当前阶段推荐你优先执行：

```bash
npm run prisma:push
```

### 为什么我现在推荐 `db push`

因为你现在还是项目初期，重点是先把数据库跑通。  
`db push` 更适合前期快速同步结构。

后面项目逐渐稳定后，再更多使用：

```bash
npm run prisma:migrate
```

### 两者区别你先简单记住

- `prisma db push`
  更适合前期快速同步

- `prisma migrate dev`
  更适合正式演进和保留迁移历史

---

## 第六步：执行种子脚本

执行：

```bash
npm run db:seed
```

如果成功，你应该能看到类似信息：

- Seed completed
- 店长账号信息
- 店员账号信息

这说明数据库已经不仅连通了，而且有了第一批演示数据。

---

## 方案 B：Neon 云数据库

这是我更推荐你当前使用的路线。

## 第一步：注册并创建 Neon 项目

你需要在 [Neon](https://neon.tech/) 创建一个项目。

创建完成后，Neon 会给你一个 PostgreSQL 连接串。

通常形态类似：

```env
postgresql://用户名:密码@xxx.neon.tech/数据库名?sslmode=require
```

---

## 第二步：把连接串写进 `.env`

把你的 `DATABASE_URL` 改成 Neon 提供的连接串。

例如：

```env
DATABASE_URL="postgresql://xxx:xxx@xxx.neon.tech/neondb?sslmode=require"
```

### 一个关键点

Neon 是云数据库，所以通常需要：

```txt
sslmode=require
```

如果少了这个参数，可能连接失败。

---

## 第三步：执行 Prisma 命令

顺序仍然建议是：

```bash
npm run prisma:generate
npm run prisma:push
npm run db:seed
```

### 为什么这套顺序不变

因为不管是本地 PostgreSQL 还是 Neon，对 Prisma 来说都只是“一个 PostgreSQL 连接地址”。

真正差异主要只是：

- 数据库在哪
- 连接串怎么写

---

## 第四步：验证是否成功

成功后你应该至少能确认三件事：

1. Prisma 命令不报连接错误
2. 数据库里已经生成表
3. seed 数据已经写入

如果你用的是 Neon，可以在 Neon 控制台里直接看到这些表。

---

## 现在阶段到底该用 `push` 还是 `migrate`

这是非常值得你理解的点。

## 当前建议

### 项目初期

先用：

```bash
npm run prisma:push
```

因为你现在模型还在不断调整。

### 项目进入稳定期

再更多使用：

```bash
npm run prisma:migrate
```

因为那时你需要：

- 保留数据库变更历史
- 让团队或部署环境能按迁移文件同步

### 对你现在来说的实用结论

先别把数据库迁移搞太重。  
第一目标是：**让表先真正存在，数据先真正能写进去。**

---

## 推荐你实际执行的命令顺序

如果你今天就要把数据库第一次跑通，建议你按这个顺序来：

```bash
npm run prisma:generate
npm run prisma:push
npm run db:seed
```

如果全部成功，说明你已经跨过了“项目从前端骨架进入真实全栈状态”的关键一步。

---

## 如果报错，优先怎么排查

## 1. `DATABASE_URL` 写错

最常见。

优先检查：

- 用户名
- 密码
- 主机地址
- 端口
- 数据库名
- Neon 是否需要 `sslmode=require`

## 2. 数据库本身没准备好

本地 PostgreSQL 常见问题是：

- 服务没启动
- 数据库没创建
- 端口不是 5432

## 3. Prisma 版本或配置方式有问题

你当前项目是 Prisma 7，数据库连接配置应该在：

- `prisma.config.ts`

而不是继续写在 `schema.prisma` 的 `url = env(...)`

## 4. seed 报关系错误

如果 seed 报错，通常说明：

- 前面的表没有创建成功
- 模型关系有问题
- 某条数据引用了不存在的记录

当前我们这套 seed 已经按依赖顺序写好了，所以正常情况下不会出这种问题。

---

## 为什么这一步非常关键

因为从这一步开始，你的项目就不再只是：

- 静态页面
- 假数据演示
- 纯前端骨架

而是正式进入：

- 有真实数据库
- 有真实模型
- 有真实写入能力

这也是你简历里“全栈落地能力”真正开始成立的地方。

---

## 我给你的现实建议

如果你今天就想继续推进项目，我建议你：

1. 优先选 **Neon**
2. 先把 `DATABASE_URL` 改成真实值
3. 跑通：

```bash
npm run prisma:generate
npm run prisma:push
npm run db:seed
```

4. 确认表和演示数据已经存在

这样你下一步就能非常自然地开始做：

- 服务项目真实列表
- 客户/宠物真实查询
- 预约真实数据读取

---

## 这一篇你应该学会什么

看完后你要能自己回答：

1. 为什么当前阶段更推荐你先用 Neon？
2. 本地 PostgreSQL 和 Neon 的本质区别是什么？
3. 为什么当前先用 `prisma:push` 更合适？
4. 数据库第一次跑通后，项目状态发生了什么变化？

如果这四个问题你能讲清楚，说明你已经开始从“会写页面”进入“能把项目真正跑起来”的阶段了。
