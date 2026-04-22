import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">PetCare Hub</p>
          <h1 className="text-2xl font-semibold text-slate-900">门店后台登录</h1>
          <p className="text-sm text-slate-500">现在已经接入账号密码登录，先用演示账号完成后台最小认证闭环。</p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>店长账号：owner@petcarehub.local</p>
          <p>店员账号：staff@petcarehub.local</p>
          <p>初始密码：petcare123</p>
        </div>

        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
