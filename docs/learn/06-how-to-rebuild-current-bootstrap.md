# 06 如何亲手复现当前工程骨架

## 本次目标

这一篇不是讲“为什么”，而是讲“怎么做”。

前面几篇文档已经解释了很多原理，这一篇要解决的是另一个很现实的问题：

**如果现在把这个项目删掉，你能不能只看文档，再自己把当前这版工程重新搭出来？**

这篇就是为这个目标写的。

---

## 你要复现的结果是什么

当你完成这一篇里的步骤后，你应该得到一个具备以下特征的项目：

- 能运行 Next.js
- 能通过 `lint`
- 能通过 `build`
- 已经接好 Tailwind、TypeScript、Prisma
- 已经有基础目录结构
- 已经有工作台、服务、客户、预约、登录这几个页面骨架
- 已经有正式的 `prisma/schema.prisma`
- 已经有种子数据脚本

也就是说，你不是只搭一个“空 Next.js 项目”，而是复现一个**能继续承接业务开发的中后台骨架**。

---

## 开始前你要准备什么

建议你先准备好下面这些条件：

### 1. Node.js

确保本机已经安装 Node.js 和 npm。

你可以先在终端里执行：

```bash
node -v
npm -v
```

### 2. 一个空目录

假设目录叫：

```txt
petcare_hub
```

### 3. 一个清晰目标

你现在做的不是官网，不是博客，也不是算法练习，而是：

**一个以预约链路为核心的中后台项目骨架。**

这个认知非常重要，因为它会决定你后面的目录和页面怎么拆。

---

## 第一步：初始化 `package.json`

在项目根目录创建 `package.json`。

你至少要包含下面几类内容：

### 1. 基础脚本

- `dev`
- `build`
- `start`
- `lint`

### 2. Prisma 相关脚本

- `prisma:generate`
- `prisma:migrate`
- `prisma:push`
- `prisma:studio`
- `db:seed`

### 3. 核心依赖

建议先装这一批：

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `prisma`
- `@prisma/client`
- `zod`
- `react-hook-form`
- `zustand`
- `date-fns`
- `next-auth`

---

## 第二步：安装依赖

在项目根目录执行：

```bash
npm install
```

### 你要知道这一步在做什么

它不是“下载包”这么简单，而是在为项目建立：

- 依赖树
- `node_modules`
- 锁文件

如果这一步失败，后面一切都不用往下做。

### 如果失败怎么办

像我这次就遇到过一次网络问题 `ECONNRESET`。这种情况优先判断：

1. 是网络问题
2. 不是代码问题

通常重新执行一次 `npm install` 就可以。

---

## 第三步：补基础配置文件

接下来创建这些文件：

- `tsconfig.json`
- `next-env.d.ts`
- `next.config.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`
- `.gitignore`
- `.env.example`
- `.env`
- `components.json`

### 你此时的核心目标

不是把每个配置写得多高级，而是先让项目具备：

- TypeScript 能识别
- Next.js 能运行
- Tailwind 能接入
- ESLint 能执行
- 环境变量有统一入口
- shadcn/ui 后续可继续接入

---

## 第四步：创建目录结构

在根目录下创建：

```txt
src/
  app/
  components/
  lib/
  stores/
  types/

prisma/
```

### 为什么这一步要尽早做

因为你后面每写一个文件，都需要有明确位置。  
尤其是中后台项目，如果一开始不拆好，后面页面一多就容易堆乱。

---

## 第五步：创建 App Router 基础文件

先补这几个最基础的页面和样式入口：

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

### 当前建议的做法

#### `layout.tsx`

负责：

- 根 HTML 结构
- 全局元信息
- 引入全局样式

#### `page.tsx`

先直接把根路由重定向到 `/dashboard`。

因为这个项目是中后台，不需要做官网首页。

#### `globals.css`

先把全局字体、背景色、基础盒模型和 Tailwind 接好。

---

## 第六步：拆登录区和后台区

创建两个路由分组：

```txt
src/app/(auth)/login/page.tsx
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/services/page.tsx
src/app/(dashboard)/customers/page.tsx
src/app/(dashboard)/appointments/page.tsx
```

### 这一步的重点

不是把业务写完，而是先把“页面归属”定清楚。

- 登录页属于认证区
- 工作台、服务、客户、预约属于后台区

这样做的最大好处是：  
后面你要给后台统一套侧边栏时，不需要去改登录页。

---

## 第七步：补基础公共组件

当前建议至少先写：

- `src/components/ui/button.tsx`
- `src/components/common/page-header.tsx`
- `src/components/layout/app-shell.tsx`

### 为什么先写这三个

#### `button.tsx`

后面几乎每个页面都会用按钮。

#### `page-header.tsx`

中后台页面顶部通常结构很像：

- 标题
- 描述
- 操作按钮

早点统一掉，后面省很多重复代码。

#### `app-shell.tsx`

它是后台整体骨架，负责：

- 侧边栏
- 菜单项
- 当前路由高亮
- 内容区域

如果没有它，每个后台页面都会重复写布局。

---

## 第八步：补 `lib` / `types` / `stores`

建议最少先补这些文件：

- `src/lib/utils.ts`
- `src/lib/prisma.ts`
- `src/lib/validations/appointment.ts`
- `src/types/domain.ts`
- `src/stores/appointment-filter.store.ts`

### 这几个文件各自是干什么的

#### `utils.ts`

放通用工具函数，比如类名合并。

#### `prisma.ts`

统一导出 Prisma Client，避免到处实例化。

#### `validations/appointment.ts`

提前把预约相关表单校验入口占住。

#### `domain.ts`

放业务常量和领域类型。

#### `appointment-filter.store.ts`

放预约列表筛选的前端状态。

---

## 第九步：创建 Prisma 正式文件

至少要创建：

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma.config.ts`

### 注意：Prisma 7 的写法

现在不要再把 `url = env("DATABASE_URL")` 写在 `schema.prisma` 里。  
你要把连接串配置放到 `prisma.config.ts` 中。

这是这一步最容易踩的坑。

---

## 第十步：准备环境变量

在 `.env.example` 和 `.env` 中至少放：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/petcare_hub?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 当前阶段为什么先放占位值也可以

因为你这一步的目标是先把工程骨架搭稳，不是立即完成线上部署。

但即使是占位值，也要先把变量名字定清楚。

---

## 第十一步：生成 Prisma Client

执行：

```bash
npm run prisma:generate
```

这一步会根据 `prisma/schema.prisma` 生成 Prisma Client。

如果这里报错，优先排查：

1. `schema.prisma` 是否有语法问题
2. `prisma.config.ts` 是否写对
3. `.env` 中是否有 `DATABASE_URL`

---

## 第十二步：执行项目校验

建议按这个顺序执行：

```bash
npm run lint
npm run build
```

### 为什么一定要跑 `build`

因为很多问题开发态不一定暴露，但生产构建时会暴露，比如：

- 类型问题
- 路由问题
- 配置兼容问题

你现在做的是求职作品，不是“本地能看就行”的 demo，所以 `build` 是否通过非常关键。

---

## 你可以怎么自测自己是否真的复现成功

如果你完成后，能同时满足下面这些条件，说明你已经基本复现成功：

1. `npm install` 成功
2. `npm run prisma:generate` 成功
3. `npm run lint` 成功
4. `npm run build` 成功
5. 访问项目时至少有：
   - `/login`
   - `/dashboard`
   - `/services`
   - `/customers`
   - `/appointments`

---

## 推荐你真的自己动手做一遍

不要只看这篇文档。  
最好的学习方式是：

1. 新建一个测试目录
2. 不看现有代码，先只看文档
3. 自己手动搭一次
4. 卡住时再对照项目源码

这样你才能真正区分：

- 哪些东西你已经理解了
- 哪些东西你只是“看着眼熟”

---

## 容易踩坑的点

## 1. 上来就写业务页面，不先补配置

这样最后一定会回头补工程底座，效率更低。

## 2. 目录没拆好就开始堆文件

这是很多初学者后期项目越来越乱的根源。

## 3. 不做 `build` 验证

这会让你误以为项目已经没问题，其实只是开发模式暂时没暴露错误。

## 4. 忽视 Prisma 版本差异

如果你照着旧教程写，很容易卡在 `generate`。

---

## 这一篇你应该学会什么

看完后你要做到：

1. 不看现成项目，也知道当前工程应该按什么顺序搭
2. 知道哪些步骤是必须先做的
3. 知道每一步出问题时应该优先排查什么
4. 能自己把当前这版工程底座重新搭出来

如果你能做到这几点，说明这些教学文档已经真正起作用了。
