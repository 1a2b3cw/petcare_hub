# 教学文档目录

这个目录专门存放项目开发过程中的教学型文档。

目标不是单纯记录“改了哪些文件”，而是帮你回答下面 5 个问题：

1. 这一步到底做了什么
2. 为什么要这样做
3. 相关文件分别有什么作用
4. 如果你自己从零开始，应该怎么复现
5. 这一步最容易踩什么坑

## 你应该怎么使用这些文档

建议你每次按下面顺序阅读：

1. 先看 `README.md`，了解当前文档结构
2. 再按编号顺序阅读对应阶段文档
3. 每看完一篇，就自己在脑子里回答一遍：
   - 这一步解决了什么问题？
   - 如果删掉这一步，项目会卡在哪里？
   - 我自己能不能不看代码把它重新做出来？

## 当前文档结构

- `01-project-bootstrap.md`
  讲项目是怎么从“空目录 + 需求文档”变成“可运行工程骨架”的

- `02-core-config-files.md`
  讲最核心的配置文件分别负责什么

- `03-prisma-setup-and-schema.md`
  讲 Prisma 目录、Prisma 7 配置方式、数据库模型和为什么这样建模

- `04-seed-data-and-demo-accounts.md`
  讲为什么要写种子数据、演示账号如何设计、如何保证脚本可重复执行

- `05-app-structure-and-pages.md`
  讲 `src` 目录为什么这么拆、当前页面骨架的作用是什么

- `06-how-to-rebuild-current-bootstrap.md`
  讲如果不看现有代码，怎样自己一步一步重建当前这版工程骨架

- `07-first-real-database-setup.md`
  讲第一次把 PostgreSQL 真正跑起来时，该如何在本地 PostgreSQL 和 Neon 之间选择并完成接入

- `08-version-strategy.md`
  讲为什么要固定依赖版本、Node 版本，以及这套项目当前采用的版本策略是什么

- `09-first-real-crud-services.md`
  讲为什么第一个真实业务模块先选服务项目管理，以及这一轮 CRUD 是怎么从 mock 数据切到真实数据库的

- `10-customer-and-pet-module.md`
  讲第二条业务主线“客户 + 宠物”是怎么做的，为什么要把宠物做成客户的子资源，以及 Server Action 和表单组件是怎么复用的

- `11-dev-performance-and-cache.md`
  讲为什么接了远程数据库以后页面会变慢，以及这一轮是怎么通过 `revalidate` 和 `revalidatePath` 做第一轮优化的

- `12-appointments-flow.md`
  讲预约模块是怎么从 mock 列表升级成真实数据库页面的，以及最小可用的状态流转为什么这样设计

- `13-appointment-detail-and-visit-record.md`
  讲预约详情页和履约记录是怎么接起来的，以及为什么要在状态流转时自动补齐到店和完成时间

- `14-repurchase-operations.md`
  讲复购运营页是怎么接到履约记录后面的，以及为什么要把回访提醒和沉睡客户放在同一个页面里

- `15-coupon-issuance-and-status.md`
  讲为什么先做手动发券而不是自动发券，以及优惠券发放和状态流转是怎么接进运营页的

- `16-customer-detail-operations-view.md`
  讲为什么要把回访任务和优惠券聚合到客户详情页里，以及这一步为什么应该复用运营模块已有的服务端动作

- `17-auth-minimal-flow.md`
  讲为什么要在这个阶段接最小认证闭环，以及 NextAuth 的登录、路由守卫和退出登录是怎么串起来的

- `18-dashboard-polish.md`
  讲为什么工作台首页要同时承担“今日事务”和“经营提醒”两类职责，以及这一轮首页为什么这样拆块

- `19-appointments-calendar-view.md`
  讲为什么预约模块要同时保留列表和日历两种视角，以及这一轮轻量时间轴为什么比完整月历更合适

- `20-reports-statistics.md`
  讲为什么在业务闭环做完后再做报表、收入趋势和热门服务是怎么用纯 CSS 和 Prisma 聚合查询实现的

- `21-auth-and-middleware.md`
  讲两层路由保护（Proxy + Dashboard Layout）是怎么配合工作的，以及为什么 JWT 存在并不代表账号一定有效

- `22-backend-security-and-performance.md`
  讲如何用 safeParse 统一校验错误、处理 P2002 唯一约束冲突、用 updateMany 实现归属权校验、以及消除全表扫描

- `23-ui-polish-and-ux.md`
  讲 Toast 通知的服务端→客户端架构、关键词搜索的 DB 层实现、骨架屏/错误边界/404 页面的 Next.js 文件约定，以及侧边栏动态门店名的数据流

## 后续写作规则

从现在开始，只要我帮你做了新的开发动作，原则上都会补一篇或更新一篇这里的文档。文档会尽量保持下面的结构：

1. 本次目标
2. 我做了什么
3. 为什么这样做
4. 关键文件说明
5. 你自己如何复现
6. 容易踩坑的点

## 你看这些文档时要特别注意

- 不要只记结论，要记“顺序”
- 不要只看页面效果，要看配置和数据流
- 不要把命令当魔法，要知道每条命令在解决什么问题

如果你能看着这些文档把项目从零再搭一遍，这套教学文档就算写对了。
