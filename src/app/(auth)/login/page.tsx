import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">PetCare Hub</p>
          <h1 className="text-2xl font-semibold text-slate-900">门店后台登录</h1>
          <p className="text-sm text-slate-500">Auth.js 还没接入前，先保留入口页和演示账号信息。</p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>店长账号：owner@petcarehub.local</p>
          <p>店员账号：staff@petcarehub.local</p>
          <p>初始密码：petcare123</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button asChild className="flex-1">
            <Link href="/dashboard">进入演示后台</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard">查看工作台</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
