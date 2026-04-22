import Link from "next/link";
import { ArrowLeft, CalendarX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppointmentNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <CalendarX className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground">预约不存在</h2>
        <p className="text-sm text-muted-foreground">该预约记录可能已被删除，或链接有误。</p>
      </div>
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href="/appointments">
          <ArrowLeft className="h-4 w-4" />
          返回预约列表
        </Link>
      </Button>
    </div>
  );
}
