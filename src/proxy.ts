import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // 保护所有非公开路由：排除 login、NextAuth API、_next 静态资源、favicon
  matcher: ["/((?!login|api/auth|api/health|_next/static|_next/image|favicon\\.ico).*)"],
};
