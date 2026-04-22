# 第 21 步：认证流程与路由保护

## 本次目标

项目一直有登录页，但没有真正保护其他路由——任何人只要知道 URL 就能绕过登录直接访问。  
本步引入两层保护机制，把认证做"闭环"。

---

## 做了什么

### 1. NextAuth.js 配置（`src/lib/auth.ts`）

使用 **Credentials Provider** + **JWT Session**（无状态，不写数据库）：

```ts
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        return ok ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
};
```

关键点：
- `isActive` 在 `authorize` 里就过滤掉了停用账号
- JWT 存在 HttpOnly Cookie，不暴露给客户端 JS

---

### 2. Proxy（原 Middleware）全局路由守卫（`src/proxy.ts`）

```ts
// src/proxy.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)"],
};
```

> **注意**：Next.js 16 把 `middleware.ts` 改名为 `proxy.ts`。功能和写法完全相同，只是文件名变了。

这一层守卫是在 Edge Runtime 上运行的，速度极快，无 DB 查询，只验证 JWT 是否存在。

---

### 3. Dashboard Layout 二次校验

Proxy 只验证 JWT 是否存在，但不能阻止"JWT 还有效但账号已被停用"的情况。  
Dashboard Layout（Server Component）做了第二层：

```ts
// src/app/(dashboard)/layout.tsx
const [user, storeProfile] = await Promise.all([
  prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } }),
  prisma.storeProfile.findUnique({ where: { id: "default-store" }, select: { name: true } }),
]);

if (!user?.isActive) redirect("/login");
```

顺手把门店名也查出来（`Promise.all` 并发，不额外增加延迟），传给 `AppShell`。

---

## 两层防护对比

| 层级 | 位置 | 触发时机 | 检查内容 | 开销 |
|------|------|----------|----------|------|
| Proxy | Edge，每个请求 | 进入任何受保护路由 | JWT 是否存在 | 极低，无 DB |
| Layout | Server Component | 进入 Dashboard | 账号 `isActive` 状态 | 1 次 DB 查询 |

---

## 登录页回调

`/login?callbackUrl=/customers` → 登录成功后 NextAuth 会自动重定向到 `/customers`。

这个行为是 NextAuth 内置的，只需要在重定向时带上 `callbackUrl` 参数即可。

---

## 类型扩展（`src/types/next-auth.d.ts`）

NextAuth 默认的 `session.user` 没有 `id` 和 `role` 字段，需要声明合并：

```ts
declare module "next-auth" {
  interface Session {
    user: { id: string; role: string } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT { id?: string }
}
```

---

## 关键收益

- 任何未登录请求都在 Edge 层被拦截，不会触达 Next.js 渲染逻辑
- 停用账号即使持有有效 JWT，也无法进入后台（JWT 有效期内的安全窗口被关闭）
- 登录状态信息（门店名）在 Layout 层一次查完，无瀑布请求
