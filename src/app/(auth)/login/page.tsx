import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PawPrint, CalendarDays, Users, BarChart3 } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

const features = [
  { icon: CalendarDays, title: "预约管理", desc: "一站式管理到店预约与排班" },
  { icon: Users, title: "客户宠物档案", desc: "完整记录客户与宠物健康信息" },
  { icon: BarChart3, title: "经营报表", desc: "实时查看收入趋势与服务热度" },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 左侧品牌区 */}
      <div className="hidden flex-col justify-between bg-[hsl(222_47%_11%)] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(174_84%_42%)]">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">PetCare Hub</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              宠物门店<br />数字化管理后台
            </h1>
            <p className="text-base leading-relaxed text-white/60">
              从预约到复购，一套系统覆盖宠物洗护门店的核心业务链路。
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-[hsl(174_84%_60%)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{f.title}</p>
                    <p className="text-sm text-white/50">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-white/30">© 2026 PetCare Hub · 作品集演示项目</p>
      </div>

      {/* 右侧登录区 */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* 移动端 logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <PawPrint className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">PetCare Hub</span>
          </div>

          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">欢迎回来</h2>
            <p className="text-sm text-muted-foreground">请输入账号密码登录门店后台</p>
          </div>

          {/* 演示账号提示 */}
          <div className="mb-6 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">演示账号</p>
            <div className="space-y-0.5 text-sm">
              <p><span className="text-muted-foreground">店长：</span><span className="font-mono font-medium">owner@petcarehub.local</span></p>
              <p><span className="text-muted-foreground">店员：</span><span className="font-mono font-medium">staff@petcarehub.local</span></p>
              <p><span className="text-muted-foreground">密码：</span><span className="font-mono font-medium">petcare123</span></p>
            </div>
          </div>

          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
