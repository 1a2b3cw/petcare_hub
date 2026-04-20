# 02 核心配置文件：项目为什么能跑起来

## 本次目标

这一篇不讲业务，只讲配置。

很多初学者能把页面写出来，但不知道为什么项目能运行、为什么路径别名能生效、为什么 Tailwind 能识别类名、为什么 Next.js 能识别 `src/app`。这些都不是“自动发生”的，而是配置文件共同工作的结果。

---

## 这一步我实际补了哪些配置

当前项目中最关键的配置文件有：

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `next-env.d.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`
- `.gitignore`
- `.env.example`
- `components.json`

你不需要一开始把每个字段都背下来，但你必须知道它们各自负责什么。

---

## 一个一个解释

## 1. `package.json`

这是项目的总开关。

它主要负责三件事：

1. 定义项目信息
2. 管理依赖
3. 提供脚本命令

### 当前脚本的意义

- `dev`
  启动本地开发服务器

- `build`
  做生产环境构建，检查项目是否真的能上线

- `start`
  启动生产构建后的应用

- `lint`
  检查代码规范和部分潜在问题

- `prisma:generate`
  根据 `schema.prisma` 生成 Prisma Client

- `prisma:migrate`
  创建并执行数据库迁移

- `prisma:push`
  把 schema 直接推到数据库

- `db:seed`
  执行种子数据脚本

### 你要记住的重点

`package.json` 不是“装依赖的清单”这么简单，它其实也是项目的命令中心。

---

## 2. `tsconfig.json`

它决定 TypeScript 如何理解你的项目。

### 当前最值得关注的配置

- `strict: true`
  开启严格模式，强制你更认真地处理类型

- `paths`
  支持 `@/*` 指向 `src/*`

### 为什么路径别名重要

如果没有路径别名，你会经常写这种导入：

```ts
import { Button } from "../../../../components/ui/button";
```

这种写法非常难维护。加了别名后可以直接写：

```ts
import { Button } from "@/components/ui/button";
```

这对于中后台项目非常重要，因为组件层级会越来越深。

### 一个细节

后面我执行 `next build` 时，Next.js 自动帮项目修正了 `tsconfig.json` 的一部分内容，比如：

- `jsx` 被改成 `react-jsx`
- `include` 增加了 `.next/dev/types/**/*.ts`

这说明：**有些配置不是你手动写死的，而是框架会在构建阶段帮助你调整到兼容状态。**

---

## 3. `next.config.ts`

这是 Next.js 项目级配置文件。

当前我们只保留了最轻量的一版：

- 开启 React 严格模式

现在它很简单，但后面如果你要加图片域名白名单、实验特性、构建优化等，也会放在这里。

---

## 4. `next-env.d.ts`

这是 Next.js 和 TypeScript 协作时的类型声明文件。

你几乎不会手动改它，但它很重要。没有它，TypeScript 对 Next.js 某些能力的类型识别就会不完整。

你可以把它理解为：**告诉 TypeScript，这个项目是一个 Next.js 项目。**

---

## 5. `postcss.config.mjs`

Tailwind 并不是凭空生效的，它要通过 PostCSS 接到项目的构建链里。

这个文件的作用就是：

- 告诉构建工具要使用 `@tailwindcss/postcss`

所以如果你写了 Tailwind 类名但样式不生效，排查时就要想到这里。

---

## 6. `eslint.config.mjs`

这个文件让 ESLint 按 Next.js 推荐规则检查你的项目。

它的作用不是“限制你写代码”，而是尽早提醒你：

- 有没有明显不规范写法
- 有没有可能的 React/Next.js 问题

对求职作品来说，这非常重要。因为可维护性本身就是项目质量的一部分。

---

## 7. `.gitignore`

这个文件决定哪些内容不应该进入版本控制。

最典型的有：

- `node_modules`
- `.next`
- `.env`

### 为什么 `.env` 不能提交

因为它通常包含敏感信息，比如数据库连接串、密钥等。

所以正确做法是：

- 提交 `.env.example`
- 不提交 `.env`

---

## 8. `.env.example`

这个文件不是给程序读的，而是给人看的。

它的作用是明确告诉协作者或未来的你：

这个项目运行至少需要哪些环境变量。

当前列出的变量有：

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

即使你暂时还没接完 Auth.js，这些变量也先定义出来，有助于统一后续认知。

---

## 9. `components.json`

这是 shadcn/ui 的配置文件。

它告诉 shadcn：

- UI 组件默认放在哪里
- 工具函数放在哪里
- 全局样式入口是哪一个文件
- 使用什么图标库

### 为什么要提前加它

因为你后面很可能会继续使用 shadcn/ui 生成更多组件。如果没有这个文件，后续命令行生成组件时，shadcn 不知道该把文件放到哪里。

---

## 你自己如何复现

### 第一步

先从 `package.json` 开始，把脚本和依赖定下来。

### 第二步

把 TypeScript 和 Next.js 的最基本配置补齐：

- `tsconfig.json`
- `next-env.d.ts`
- `next.config.ts`

### 第三步

接 Tailwind 和 ESLint：

- `postcss.config.mjs`
- `eslint.config.mjs`

### 第四步

补环境变量和版本控制规则：

- `.env.example`
- `.gitignore`

### 第五步

如果项目打算用 shadcn/ui，就提前补 `components.json`

---

## 容易踩坑的点

## 1. 只会复制配置，不知道配置之间的关系

比如很多人知道要写 `@/*` 路径别名，但不知道：

- `tsconfig.json` 要配
- 导入路径要按别名写
- 项目目录也最好围绕 `src` 去组织

## 2. 误以为 `.env.example` 可以省略

短期看没问题，长期一定会混乱。

## 3. 忽略 Next.js 自动修正配置

你手写的配置不一定就是最终生效版本，所以执行一次真实构建非常重要。

---

## 这一篇你应该学会什么

看完后你要能自己讲明白：

1. `package.json` 为什么不只是依赖列表
2. `tsconfig.json` 为什么对大型项目尤其重要
3. `postcss.config.mjs` 为什么和 Tailwind 有关系
4. 为什么 `.env.example` 和 `.env` 要同时存在
5. `components.json` 为什么值得提前准备

你真正理解这些之后，项目配置对你来说就不是“黑盒”了。
