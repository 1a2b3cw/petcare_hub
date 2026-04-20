"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { AppSidebarItem } from "@/types/domain";

const sidebarItems: AppSidebarItem[] = [
  { href: "/dashboard", label: "工作台", description: "查看今日预约与待办" },
  { href: "/services", label: "服务项目", description: "维护服务时长与价格" },
  { href: "/customers", label: "客户宠物", description: "查看客户与宠物档案" },
  { href: "/appointments", label: "预约管理", description: "处理预约创建与状态流转" },
];

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-6">
          <div className="mb-8 space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">PetCare Hub</p>
            <h2 className="text-xl font-semibold">门店后台</h2>
            <p className="text-sm text-slate-500">先把预约闭环做稳，再扩展运营能力。</p>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl border px-4 py-3 transition-colors",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className={cn("mt-1 text-xs", active ? "text-slate-300" : "text-slate-500")}>{item.description}</p>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
