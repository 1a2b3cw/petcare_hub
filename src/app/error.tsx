"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border bg-white p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-gray-900">页面出错了</h2>
            <p className="text-sm text-gray-500">
              {error.message || "发生了意外错误，请稍后重试。"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重试
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Home className="h-3.5 w-3.5" />
              回到工作台
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
