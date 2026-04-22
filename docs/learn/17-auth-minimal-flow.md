# 第 17 步：登录与认证最小闭环

## 本次目标

把项目从“谁都能直接进后台”升级成真正有最小认证闭环的后台系统：

- 用演示账号登录
- 未登录时拦截后台路由
- 已登录后才能进入后台
- 在侧边栏退出登录

这一步做完后，项目就不再只是一个“假后台壳子”，而是开始具备真正后台系统应有的访问边界。

## 我做了什么

这一轮新增/修改了这些核心文件：

```text
src/lib/auth.ts
src/types/next-auth.d.ts
src/app/api/auth/[...nextauth]/route.ts
src/components/auth/login-form.tsx
src/components/auth/logout-button.tsx
src/app/(auth)/login/page.tsx
src/components/layout/app-shell.tsx
middleware.ts
```

## 这一步新增了哪些能力

### 1. 账号密码登录

现在登录页已经不是占位页，而是真的会校验数据库里的账号密码。

当前使用的是种子数据里的演示账号：

- `owner@petcarehub.local`
- `staff@petcarehub.local`
- 密码：`petcare123`

### 2. 后台路由守卫

现在这些页面都被保护起来了：

- `/dashboard`
- `/services`
- `/customers`
- `/appointments`
- `/operations`

如果没有登录，访问这些页面会自动跳去 `/login`。

### 3. 已登录自动跳转

如果已经登录，再访问 `/login`，会直接跳回后台，避免重复登录。

### 4. 退出登录

侧边栏底部现在新增了“退出登录”按钮，点一下就会退出并回到登录页。

## 为什么这样做

## 1. 为什么现在就接认证？

因为到这一步，项目已经有了比较完整的后台业务：

- 服务管理
- 客户与宠物档案
- 预约流转
- 履约记录
- 复购运营

如果还是完全不做登录，整体会很像“演示用页面集合”，不像真正后台系统。

所以这个时间点接一版最小认证，性价比很高。

## 2. 为什么选 `next-auth` 的 Credentials 登录？

因为你现在已经有：

- 用户表
- 邮箱
- `passwordHash`

最自然的做法就是直接走账号密码登录。

而且这版方案足够轻：

- 不引入第三方 OAuth
- 不做注册
- 不做复杂权限系统

只先把“登录 / 守卫 / 退出”跑通。

## 3. 为什么用 middleware 做路由保护？

因为后台路由保护非常适合放在统一入口。

这样你不用在每个页面都手写：

- 判断有没有 session
- 没有就 redirect

交给 `middleware.ts` 统一拦，结构更清楚，也更像真实项目。

## 关键文件说明

### `src/lib/auth.ts`

这里是认证核心配置。

主要做了三件事：

1. 配置 `CredentialsProvider`
2. 用 Prisma 查用户
3. 用 `bcrypt.compare()` 校验密码

如果账号不存在、被停用、或者密码不匹配，就返回 `null`，登录失败。

### `src/app/api/auth/[...nextauth]/route.ts`

这是 NextAuth 的路由处理器。

它把 `authOptions` 接到 App Router 的 API Route 上，让登录、会话、退出这些能力真正可用。

### `src/components/auth/login-form.tsx`

这里是登录表单组件。

它做的是：

- 收集邮箱和密码
- 调 `signIn("credentials")`
- 成功后跳到目标页面
- 失败后显示错误提示

### `middleware.ts`

这里用 `withAuth()` 统一保护后台路由，并明确指定自定义登录页是 `/login`。

这一步很重要，否则中间件可能会把未登录用户送去默认的 NextAuth 登录页。

### `src/components/auth/logout-button.tsx`

这是一个很小但很实用的组件，专门负责退出登录。

点击后会调用 `signOut()` 并跳回 `/login`。

## 你自己如何复现

如果你想自己重做一遍，建议顺序是：

1. 先写 `src/lib/auth.ts`
2. 再补 `[...nextauth]/route.ts`
3. 再写 `login-form.tsx`
4. 再把 `login/page.tsx` 从占位页改成真实登录页
5. 最后补 `middleware.ts` 做后台路由守卫

## 验证方式

建议这样测：

1. 退出当前后台
2. 直接访问 `/dashboard`
3. 确认是否会自动跳到 `/login`
4. 输入演示账号密码登录
5. 登录成功后进入后台
6. 点击侧边栏“退出登录”
7. 确认是否回到登录页

## 容易踩坑的点

1. **middleware 不指定自定义登录页**
   这样未登录时会被送去默认的 NextAuth 页面，而不是你的 `/login`。

2. **Session/JWT 类型不补充**
   如果你后面想在 session 里放自定义字段，不补类型声明很容易在 TypeScript 下报错。

3. **只做登录页，不做后台拦截**
   这样用户仍然能绕过登录页直接进后台，等于认证没有真正建立边界。

## 做完以后项目状态

现在这套项目已经具备：

- 真实业务模块
- 真实数据库
- 真实认证入口
- 真实后台访问边界

这会让它更像一个能上线、也更像一个能写进简历的中后台作品。
