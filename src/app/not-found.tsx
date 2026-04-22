import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">404</h1>
          <p className="text-sm text-muted-foreground">页面不存在，可能已被删除或链接有误。</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Home className="h-4 w-4" />
          回到工作台
        </Link>
      </div>
    </div>
  );
}
