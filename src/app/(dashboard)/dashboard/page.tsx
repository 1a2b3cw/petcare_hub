import Link from "next/link";
import { endOfDay, startOfDay, subDays } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";

import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

const statusConfig: Record<AppointmentStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "待确认", variant: "outline" },
  CONFIRMED: { label: "已确认", variant: "secondary" },
  IN_SERVICE: { label: "服务中", variant: "default" },
  COMPLETED: { label: "已完成", variant: "secondary" },
  CANCELLED: { label: "已取消", variant: "outline" },
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(date);
}

export default async function DashboardPage() {
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);
  const dormantCutoff = subDays(today, 30);

  const [
    todayAppointments,
    pendingAppointments,
    todayCompleted,
    pendingFollowUps,
    recentFollowUps,
    todayAppointmentList,
    dormantCustomersCount,
    activeCoupons,
  ] = await Promise.all([
    prisma.appointment.count({ where: { scheduledDate: { gte: dayStart, lte: dayEnd } } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "COMPLETED", updatedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.followUpTask.count({ where: { status: "PENDING" } }),
    prisma.followUpTask.findMany({
      where: { status: "PENDING" },
      orderBy: { dueDate: "asc" },
      take: 4,
      include: {
        customer: { select: { name: true } },
        pet: { select: { name: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { scheduledDate: { gte: dayStart, lte: dayEnd } },
      orderBy: [{ startTime: "asc" }],
      take: 8,
      include: {
        customer: { select: { id: true, name: true } },
        pet: { select: { name: true } },
        serviceItem: { select: { name: true } },
        staff: { select: { name: true } },
      },
    }),
    // 用数据库聚合直接算沉睡客户数，避免加载全量客户到内存
    prisma.customer.count({
      where: {
        appointments: { some: { status: "COMPLETED" } },
        NOT: {
          appointments: {
            some: { status: "COMPLETED", scheduledDate: { gte: dormantCutoff } },
          },
        },
      },
    }),
    prisma.coupon.count({ where: { status: "UNUSED" } }),
  ]);

  const stats = [
    { label: "今日预约", value: todayAppointments, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "待确认", value: pendingAppointments, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "今日完成", value: todayCompleted, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "待回访", value: pendingFollowUps, icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description={`${new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(today)}`}
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/operations">
                <TrendingUp className="h-4 w-4" />
                复购运营
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/appointments/new">
                <Plus className="h-4 w-4" />
                新建预约
              </Link>
            </Button>
          </div>
        }
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* 今日预约列表 */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">今日预约安排</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/appointments">
                查看全部 <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {todayAppointmentList.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <CalendarDays className="h-8 w-8 opacity-30" />
                <p>今天还没有预约</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/appointments/new">新建预约</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {todayAppointmentList.map((appt) => {
                  const cfg = statusConfig[appt.status];
                  return (
                    <div key={appt.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40 transition-colors">
                      <div className="w-14 flex-none text-center">
                        <p className="text-sm font-semibold text-foreground">{formatTime(appt.startTime)}</p>
                        {appt.endTime && (
                          <p className="text-xs text-muted-foreground">{formatTime(appt.endTime)}</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/customers/${appt.customer.id}`}
                            className="text-sm font-medium text-foreground hover:text-primary truncate"
                          >
                            {appt.customer.name}
                          </Link>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground truncate">{appt.pet.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {appt.serviceItem.name}
                          {appt.staff && ` · ${appt.staff.name}`}
                        </p>
                      </div>
                      <Badge variant={cfg.variant} className="flex-none text-xs">
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧面板 */}
        <div className="space-y-4">
          {/* 快捷入口 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">快捷入口</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/customers/new", label: "新增客户", icon: Users },
                { href: "/appointments/new", label: "新建预约", icon: CalendarDays },
                { href: "/operations", label: "处理回访", icon: MessageSquare },
                { href: "/reports", label: "查看报表", icon: TrendingUp },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-auto flex-col gap-1.5 py-3 text-xs"
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* 经营提醒 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">经营提醒</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "沉睡客户", value: dormantCustomersCount, unit: "人", href: "/operations" },
                { label: "未使用优惠券", value: activeCoupons, unit: "张", href: "/operations" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">
                    {item.value} {item.unit}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* 待回访 */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">待处理回访</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/operations">
                  全部 <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">当前没有待回访任务。</p>
              ) : (
                <div className="space-y-2">
                  {recentFollowUps.map((task) => (
                    <div key={task.id} className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
                      <p className="font-medium text-foreground">
                        {task.customer.name}
                        {task.pet?.name ? ` · ${task.pet.name}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        回访日期：{formatDay(task.dueDate)}
                        {task.note ? ` · ${task.note}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
