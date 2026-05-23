# PetCare Hub

PetCare Hub 是一个为宠物诊所/宠物服务中心设计的后台管理与预约系统模板，基于 Next.js + Prisma + PostgreSQL，提供客户、宠物、预约、服务与优惠券等核心功能的管理界面与示例实现。

## 主要功能

- 客户（Customer）与宠物（Pet）管理
- 预约（Appointment）与到诊记录（Visit Record）
- 服务（Service）与项目信息管理
- 优惠券（Coupon）发放与核销示例
- 简易 Dashboard 与报表视图
- 基于角色/会话的认证示例（NextAuth）

## 技术栈

- 框架：Next.js 16
- 语言：TypeScript
- ORM：Prisma（PostgreSQL）
- 认证：next-auth
- UI：Tailwind / Radix / Lucide

## 快速开始

先安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

构建与运行：

```bash
npm run build
npm start
```

## 数据库 / Prisma

本项目使用 Prisma 管理数据库。常用命令：

```bash
# 生成 Prisma 客户端（postinstall 会自动执行）
npm run prisma:generate

# 开发迁移（交互式）
npm run prisma:migrate

# 将 Prisma schema 推送到数据库（非破坏性）
npm run prisma:push

# 打开 Prisma Studio
npm run prisma:studio

# 运行数据种子脚本
npm run db:seed

# 执行修复脚本（仓库内）
npm run db:repair:user-columns
```

## 环境变量（示例）

至少需要设置：

- `DATABASE_URL` - PostgreSQL 连接字符串
- `NEXTAUTH_SECRET` - NextAuth 用的随机字符串
- `NEXTAUTH_URL` - 本地/部署的应用根地址（如 `http://localhost:3000`）

根据你的部署或测试需要，可能还需设置邮件服务、第三方 OAuth 等凭据，详见代码中的 `src/lib` 与 `src/api` 实现。

建议在开始前先创建数据库并运行 `npm run prisma:generate` 与 `npm run prisma:migrate` 或 `npm run prisma:push`。

## 项目结构（摘要）

- `src/app` - Next.js 路由与页面
- `src/components` - UI 与页面组件
- `src/lib` - 应用工具与库（如 `prisma.ts`, `auth.ts`）
- `prisma` - Prisma schema、seed 与 SQL 修复脚本
- `docs/learn` - 项目内开发文档与使用说明

更多细节请查看 `docs/learn` 下的章节。

## 开发注意

- 项目使用 Node.js 24+ 与 npm 11+（见 `package.json` 中 `engines`）
- `postinstall` 脚本会自动运行 `prisma generate`，请确保 `DATABASE_URL` 可用（或按需跳过）

## 贡献

欢迎提 Issues 或 Pull Requests。请确保代码风格与现有结构一致，并在必要时更新或补充 `docs/learn` 中的文档。

## 许可证

本仓库未指定许可证，请根据需要添加 `LICENSE` 文件。

---

如需我把 README 翻译为英文、添加徽章、或根据部署平台（Vercel / Docker / PM2 等）补充部署说明，我可以继续完善。