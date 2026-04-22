"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Cog,
  LayoutDashboard,
  Megaphone,
  PawPrint,
  Scissors,
  Users,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "核心业务",
    items: [
      { href: "/dashboard",    label: "工作台",   icon: LayoutDashboard },
      { href: "/appointments", label: "预约管理", icon: CalendarDays },
      { href: "/customers",    label: "客户宠物", icon: Users },
      { href: "/services",     label: "服务项目", icon: Scissors },
    ],
  },
  {
    label: "运营增长",
    items: [
      { href: "/operations", label: "复购运营", icon: Megaphone },
      { href: "/reports",    label: "经营报表", icon: BarChart3 },
    ],
  },
];

type AppSidebarProps = {
  onNavigate?: () => void;
};

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[hsl(222_47%_11%)] text-[hsl(213_27%_80%)]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[hsl(222_47%_17%)] px-5 py-4">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[hsl(174_84%_42%)]">
          <PawPrint className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">PetCare Hub</p>
          <p className="text-xs text-[hsl(213_27%_55%)]">门店后台</p>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={cn("space-y-0.5", gi > 0 && "mt-5")}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(213_27%_45%)]">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[hsl(174_84%_42%)/20%] text-[hsl(174_84%_60%)]"
                      : "text-[hsl(213_27%_70%)] hover:bg-[hsl(222_47%_17%)] hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-none",
                      active ? "text-[hsl(174_84%_60%)]" : "text-[hsl(213_27%_55%)]",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 底部 */}
      <div className="border-t border-[hsl(222_47%_17%)] px-3 py-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-[hsl(174_84%_42%)/20%] text-[hsl(174_84%_60%)]"
              : "text-[hsl(213_27%_70%)] hover:bg-[hsl(222_47%_17%)] hover:text-white",
          )}
        >
          <Cog className="h-4 w-4 flex-none text-[hsl(213_27%_55%)]" />
          门店设置
        </Link>
        <div className="mt-2 px-3">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
