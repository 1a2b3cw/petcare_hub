"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* 桌面端固定侧边栏 */}
      <aside className="hidden w-60 flex-none flex-col md:flex">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <AppSidebar onNavigate={() => {}} />
        </div>
      </aside>

      {/* 移动端侧边栏抽屉 */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>导航菜单</SheetTitle>
          </SheetHeader>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* 主内容区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 顶部 header（移动端显示菜单按钮） */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-sm md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">打开菜单</span>
          </Button>
          <span className="text-sm font-semibold">PetCare Hub</span>
        </header>

        <main className="flex-1 p-6 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
