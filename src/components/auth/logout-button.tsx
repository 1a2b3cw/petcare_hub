"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-2 rounded-lg px-0 py-1.5 text-sm text-[hsl(213_27%_55%)] transition-colors hover:text-[hsl(0_72%_70%)]"
    >
      <LogOut className="h-4 w-4 flex-none" />
      退出登录
    </button>
  );
}
