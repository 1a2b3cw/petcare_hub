"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

const successMessages: Record<string, string> = {
  created: "创建成功",
  updated: "修改已保存",
  deleted: "已删除",
  saved: "保存成功",
  sent: "发放成功",
};

function SearchParamToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const success = searchParams.get("success");
    if (!success) return;

    const message = successMessages[success] ?? "操作成功";
    toast.success(message);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("success");
    const newUrl = params.size > 0 ? `${pathname}?${params}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}

export function SearchParamToast() {
  return (
    <Suspense fallback={null}>
      <SearchParamToastInner />
    </Suspense>
  );
}
