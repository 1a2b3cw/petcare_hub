import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 校验账号是否仍然有效，防止已停用账号利用残存 JWT 进入后台
  const [user, storeProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true },
    }),
    prisma.storeProfile.findUnique({
      where: { id: "default-store" },
      select: { name: true },
    }),
  ]);

  if (!user?.isActive) {
    redirect("/login");
  }

  return <AppShell storeName={storeProfile?.name}>{children}</AppShell>;
}
