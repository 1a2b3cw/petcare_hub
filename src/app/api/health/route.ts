import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. 检查环境变量
  checks.env = {
    DATABASE_URL: process.env.DATABASE_URL ? "✅ 已设置" : "❌ 未设置",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ 已设置" : "❌ 未设置",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "❌ 未设置",
    NODE_ENV: process.env.NODE_ENV,
  };

  // 2. 测试数据库连接
  try {
    const userCount = await prisma.user.count();
    checks.database = {
      status: "✅ 连接成功",
      userCount,
      note: userCount === 0 ? "⚠️ 数据库里没有用户，请先运行 seed" : "正常",
    };
  } catch (err) {
    checks.database = {
      status: "❌ 连接失败",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(checks, { status: 200 });
}
