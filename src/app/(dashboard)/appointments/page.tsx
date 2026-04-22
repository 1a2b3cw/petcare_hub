import Link from "next/link";
import { Suspense } from "react";
import { addDays, endOfDay, format, parse, startOfDay, subDays } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";

import { advanceAppointmentStatusAction, cancelAppointmentAction } from "@/app/(dashboard)/appointments/actions";
import { SearchInput } from "@/components/common/search-input";
import { PageHeader } from "@/components/common/page-header";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { appointmentStatusOptions } from "@/types/domain";

export const dynamic = "force-dynamic";

type AppointmentsPageProps = {
  searchParams: Promise<{ status?: string; view?: string; date?: string; q?: string }>;
};

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING:   { label: "待确认", className: "border-amber-200 bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "已确认", className: "border-sky-200 bg-sky-50 text-sky-700" },
  IN_SERVICE:{ label: "服务中", className: "border-violet-200 bg-violet-50 text-violet-700" },
  COMPLETED: { label: "已完成", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "已取消", className: "border-border bg-muted text-muted-foreground" },
};

function nextActionText(status: AppointmentStatus) {
  if (status === "PENDING") return "确认预约";
  if (status === "CONFIRMED") return "开始服务";
  if (status === "IN_SERVICE") return "完成服务";
  return null;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function safeParseDate(value?: string) {
  if (!value) return new Date();
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function buildHref(input: { view: "list" | "calendar"; status: string; date?: string; q?: string }) {
  const p = new URLSearchParams();
  if (input.view !== "list") p.set("view", input.view);
  if (input.status !== "ALL") p.set("status", input.status);
  if (input.date) p.set("date", input.date);
  if (input.q) p.set("q", input.q);
  const qs = p.toString();
  return qs ? `/appointments?${qs}` : "/appointments";
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const params = await searchParams;
  const status = params.status && appointmentStatusOptions.some((o) => o.value === params.status) ? params.status : "ALL";
  const view = params.view === "calendar" ? "calendar" : "list";
  const selectedDate = safeParseDate(params.date);
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const q = params.q?.trim() ?? "";

  const where = {
    ...(status === "ALL" ? {} : { status: status as AppointmentStatus }),
    ...(view === "calendar" || params.date
      ? { scheduledDate: { gte: startOfDay(selectedDate), lte: endOfDay(selectedDate) } }
      : {}),
    ...(q && view === "list"
      ? {
          OR: [
            { appointmentNo: { contains: q, mode: "insensitive" as const } },
            { customer: { name: { contains: q, mode: "insensitive" as const } } },
            { pet: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: view === "calendar" || params.date ? [{ startTime: "asc" }] : [{ scheduledDate: "desc" }, { startTime: "asc" }],
    take: view === "list" && !params.date && !q ? 100 : undefined,
    include: {
      customer: { select: { id: true, name: true } },
      pet: { select: { name: true } },
      serviceItem: { select: { name: true } },
      staff: { select: { name: true } },
    },
  });

  const timeSlots = Array.from({ length: 12 }, (_, i) => `${String(9 + i).padStart(2, "0")}:00`);

  return (
    <div className="space-y-5">
      <SearchParamToast />
      <PageHeader
        title="预约管理"
        actions={
          <Button asChild size="sm">
            <Link href="/appointments/new">
              <Plus className="h-4 w-4" /> 新建预约
            </Link>
          </Button>
        }
      />

      {/* 视图切换 + 搜索框 + 日期导航 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {(["list", "calendar"] as const).map((v) => (
              <Button
                key={v}
                asChild
                size="sm"
                variant={view === v ? "default" : "ghost"}
                className="h-7 px-3 text-xs"
              >
                <Link href={buildHref({ view: v, status, date: v === "calendar" ? selectedDateKey : params.date })}>
                  {v === "list" ? "列表" : "日历"}
                </Link>
              </Button>
            ))}
          </div>
          {view === "list" && (
            <Suspense fallback={null}>
              <SearchInput placeholder="搜索预约号、客户、宠物…" className="w-full sm:w-56" />
            </Suspense>
          )}
        </div>

        {view === "calendar" && (
          <div className="flex items-center gap-1">
            <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
              <Link href={buildHref({ view, status, date: format(subDays(selectedDate, 1), "yyyy-MM-dd") })}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span className="min-w-32 rounded-md border bg-background px-3 py-1.5 text-center text-sm font-medium">
              {new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" }).format(selectedDate)}
            </span>
            <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
              <Link href={buildHref({ view, status, date: format(addDays(selectedDate, 1), "yyyy-MM-dd") })}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-1.5">
        {[{ value: "ALL", label: "全部" }, ...appointmentStatusOptions].map((opt) => (
          <Button
            key={opt.value}
            asChild
            size="sm"
            variant={status === opt.value ? "default" : "outline"}
            className="h-7 px-3 text-xs"
          >
            <Link href={buildHref({ view, status: opt.value, date: view === "calendar" ? selectedDateKey : params.date })}>
              {opt.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* 日历视图 */}
      {view === "calendar" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base">当日排班</CardTitle>
            </CardHeader>
            <CardContent className="scroll-area max-h-[70vh] divide-y overflow-y-auto p-0">
              {timeSlots.map((slot) => {
                const slotAppts = appointments.filter((a) => format(a.startTime, "HH:00") === slot);
                return (
                  <div key={slot} className="grid gap-3 px-5 py-4 md:grid-cols-[70px_1fr]">
                    <p className="text-sm font-medium text-muted-foreground">{slot}</p>
                    <div>
                      {slotAppts.length === 0 ? (
                        <div className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">暂无</div>
                      ) : (
                        <div className="space-y-2">
                          {slotAppts.map((a) => (
                            <div key={a.id} className="rounded-lg border bg-muted/30 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <Link href={`/appointments/${a.id}`} className="text-sm font-semibold text-foreground hover:text-primary">
                                    {a.appointmentNo}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{a.customer.name} · {a.pet.name}</p>
                                  <p className="text-xs text-muted-foreground">{a.serviceItem.name} · {formatTime(a.startTime)}–{formatTime(a.endTime ?? a.startTime)}</p>
                                </div>
                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig[a.status].className}`}>
                                  {statusConfig[a.status].label}
                                </span>
                              </div>
                              <div className="mt-2.5 flex gap-2">
                                <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                                  <Link href={`/appointments/${a.id}`}>详情</Link>
                                </Button>
                                {nextActionText(a.status) && (
                                  <form action={advanceAppointmentStatusAction.bind(null, a.id)}>
                                    <SubmitButton size="sm" className="h-7 px-2.5 text-xs" pendingText="处理中...">
                                      {nextActionText(a.status)}
                                    </SubmitButton>
                                  </form>
                                )}
                                {a.status !== "COMPLETED" && a.status !== "CANCELLED" && (
                                  <form action={cancelAppointmentAction.bind(null, a.id)}>
                                    <SubmitButton size="sm" variant="ghost" className="h-7 px-2.5 text-xs" pendingText="...">取消</SubmitButton>
                                  </form>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base">当天摘要</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                {[
                  { label: "预约总数", value: appointments.length },
                  { label: "待确认", value: appointments.filter((a) => a.status === "PENDING").length },
                  { label: "服务中", value: appointments.filter((a) => a.status === "IN_SERVICE").length },
                  { label: "已完成", value: appointments.filter((a) => a.status === "COMPLETED").length },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* 列表视图 */
        <Card className="border shadow-sm">
          {appointments.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <CalendarDays className="h-8 w-8 opacity-30" />
              {q ? <p>没有找到匹配「{q}」的预约</p> : <p>当前筛选条件下没有预约</p>}
              <Button asChild size="sm" variant="outline">
                <Link href="/appointments/new">新建预约</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* 移动端卡片列表 */}
              <div className="divide-y md:hidden">
                {appointments.map((a) => {
                  const nextText = nextActionText(a.status);
                  const canCancel = a.status !== "COMPLETED" && a.status !== "CANCELLED";
                  return (
                    <div key={a.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/appointments/${a.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                            {a.appointmentNo}
                          </Link>
                          <p className="mt-0.5 text-sm font-medium text-foreground">
                            <Link href={`/customers/${a.customer.id}`} className="hover:text-primary">{a.customer.name}</Link>
                            <span className="text-muted-foreground"> · {a.pet.name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{a.serviceItem.name} · {formatDateTime(a.startTime)}</p>
                        </div>
                        <span className={`flex-none rounded-full border px-2 py-0.5 text-xs font-medium ${statusConfig[a.status].className}`}>
                          {statusConfig[a.status].label}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                          <Link href={`/appointments/${a.id}`}>详情</Link>
                        </Button>
                        {nextText && (
                          <form action={advanceAppointmentStatusAction.bind(null, a.id)}>
                            <SubmitButton size="sm" className="h-7 px-2.5 text-xs" pendingText="...">{nextText}</SubmitButton>
                          </form>
                        )}
                        {canCancel && (
                          <form action={cancelAppointmentAction.bind(null, a.id)}>
                            <SubmitButton size="sm" variant="ghost" className="h-7 px-2.5 text-xs" pendingText="...">取消</SubmitButton>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 桌面端表格 */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-32">预约编号</TableHead>
                      <TableHead>客户 / 宠物</TableHead>
                      <TableHead>服务项目</TableHead>
                      <TableHead>预约时间</TableHead>
                      <TableHead>员工</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => {
                      const nextText = nextActionText(a.status);
                      const canCancel = a.status !== "COMPLETED" && a.status !== "CANCELLED";
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Link href={`/appointments/${a.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                              {a.appointmentNo}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/customers/${a.customer.id}`} className="font-medium text-foreground hover:text-primary">
                              {a.customer.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{a.pet.name}</p>
                          </TableCell>
                          <TableCell className="text-sm">{a.serviceItem.name}</TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(a.startTime)}
                            {a.endTime && <p className="text-xs text-muted-foreground">至 {formatTime(a.endTime)}</p>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.staff?.name ?? "未分配"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig[a.status].className}`}>
                              {statusConfig[a.status].label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1.5">
                              <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                                <Link href={`/appointments/${a.id}`}>详情</Link>
                              </Button>
                              {nextText && (
                                <form action={advanceAppointmentStatusAction.bind(null, a.id)}>
                                  <SubmitButton size="sm" className="h-7 px-2.5 text-xs" pendingText="...">{nextText}</SubmitButton>
                                </form>
                              )}
                              {canCancel && (
                                <form action={cancelAppointmentAction.bind(null, a.id)}>
                                  <SubmitButton size="sm" variant="ghost" className="h-7 px-2.5 text-xs" pendingText="...">取消</SubmitButton>
                                </form>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
