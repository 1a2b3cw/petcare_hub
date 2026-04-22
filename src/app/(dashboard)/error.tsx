"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md border shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">出了一点问题</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "操作失败，请稍后重试。"}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/60">错误码：{error.digest}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              重试
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/dashboard">
                <Home className="h-3.5 w-3.5" />
                回到工作台
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
