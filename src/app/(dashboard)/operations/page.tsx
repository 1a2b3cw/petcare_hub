import Link from "next/link";
import { differenceInCalendarDays, startOfDay, subDays } from "date-fns";
import { MessageSquare, Tag, Users } from "lucide-react";
import type { CouponStatus, CouponType } from "@prisma/client";

import {
  completeFollowUpTaskAction,
  createCouponAction,
  markCouponExpiredAction,
  markCouponUsedAction,
  skipFollowUpTaskAction,
} from "@/app/(dashboard)/operations/actions";
import { PageHeader } from "@/components/common/page-header";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { CouponForm } from "@/components/operations/coupon-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

function formatDate(date: Date | null | undefined) {
  if (!date) return "未填写";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function daysSince(date: Date) {
  return Math.max(0, differenceInCalendarDays(startOfDay(new Date()), startOfDay(date)));
}

function followUpDueText(date: Date) {
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
  if (diff > 0) return `${diff} 天后`;
  if (diff < 0) return `逾期 ${Math.abs(diff)} 天`;
  return "今天";
}

function formatMoney(value: number | null | undefined, type: CouponType = "CASH") {
  if (value == null) return "未填写";
  if (type === "DISCOUNT") return `${value} 折`;
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 0 }).format(value);
}

const couponStatusConfig: Record<CouponStatus, { label: string; className: string }> = {
  UNUSED:  { label: "未使用", className: "border-amber-200 bg-amber-50 text-amber-700" },
  USED:    { label: "已使用", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "已过期", className: "border-border bg-muted text-muted-foreground" },
};

export default async function OperationsPage() {
  const dormantCutoff = subDays(new Date(), 30);

  const [pendingTasks, pendingCount, doneCount, skippedCount, dormantRaw, activeCoupons, customers, coupons] =
    await Promise.all([
      prisma.followUpTask.findMany({
        where: { status: "PENDING" },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          pet: { select: { name: true } },
        },
        take: 20,
      }),
      prisma.followUpTask.count({ where: { status: "PENDING" } }),
      prisma.followUpTask.count({ where: { status: "DONE" } }),
      prisma.followUpTask.count({ where: { status: "SKIPPED" } }),
      // 数据库直接过滤沉睡客户，不再全量加载后 JS 筛选
      prisma.customer.findMany({
        where: {
          appointments: { some: { status: "COMPLETED" } },
          NOT: {
            appointments: {
              some: { status: "COMPLETED", scheduledDate: { gte: dormantCutoff } },
            },
          },
        },
        include: {
          pets: { orderBy: { createdAt: "asc" }, select: { id: true, name: true } },
          appointments: {
            where: { status: "COMPLETED" },
            orderBy: { scheduledDate: "desc" },
            take: 1,
            select: { id: true, scheduledDate: true, serviceItem: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 30,
      }),
      prisma.coupon.count({ where: { status: "UNUSED" } }),
      // 发券下拉列表加 take 上限，避免客户量大时撑爆内存
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, name: true, phone: true },
      }),
      prisma.coupon.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 12,
        include: { customer: { select: { id: true, name: true, phone: true } } },
      }),
    ]);

  const dormantCustomers = dormantRaw.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    petsLabel: c.pets.map((p) => p.name).join("、") || "暂无宠物",
    lastCompletedAt: c.appointments[0]!.scheduledDate,
    lastServiceName: c.appointments[0]!.serviceItem.name,
  }));

  return (
    <div className="space-y-6">
      <SearchParamToast />
      <PageHeader title="复购运营" />

      {/* 统计卡 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "待回访", value: pendingCount, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "已完成回访", value: doneCount, icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "沉睡客户", value: dormantCustomers.length, icon: Users, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "未使用券", value: activeCoupons, icon: Tag, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-3xl font-bold">{item.value}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${item.bg}`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 回访任务 + 沉睡客户 */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">待回访任务</CardTitle>
          </CardHeader>
          <div className="scroll-area overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>客户</TableHead>
                  <TableHead>宠物</TableHead>
                  <TableHead>回访日</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-7 w-7 opacity-25" />
                        <p>暂无待回访任务</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Link href={`/customers/${task.customer.id}`} className="font-medium text-foreground hover:text-primary">
                          {task.customer.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{task.customer.phone}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.pet?.name ?? "未指定"}</TableCell>
                      <TableCell className="text-sm">
                        <p>{formatDate(task.dueDate)}</p>
                        <p className={`text-xs ${differenceInCalendarDays(startOfDay(task.dueDate), startOfDay(new Date())) < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                          {followUpDueText(task.dueDate)}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.note || "—"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <form action={completeFollowUpTaskAction.bind(null, task.id)}>
                            <SubmitButton size="sm" className="h-7 px-2.5 text-xs" pendingText="...">完成</SubmitButton>
                          </form>
                          <form action={skipFollowUpTaskAction.bind(null, task.id)}>
                            <SubmitButton size="sm" variant="ghost" className="h-7 px-2.5 text-xs" pendingText="...">跳过</SubmitButton>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">沉睡客户</CardTitle>
              <span className="text-xs text-muted-foreground">超 30 天未到店</span>
            </div>
          </CardHeader>
          <CardContent className="scroll-area max-h-80 divide-y overflow-y-auto p-0">
            {dormantCustomers.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Users className="h-7 w-7 opacity-25" />
                <p>暂无沉睡客户</p>
              </div>
            ) : (
              dormantCustomers.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/customers/${c.id}`} className="font-medium text-foreground hover:text-primary">
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs whitespace-nowrap">
                      {daysSince(c.lastCompletedAt)} 天未到店
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    上次：{c.lastServiceName} · {formatDate(c.lastCompletedAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 发券 + 券列表 */}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">手动发券</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <CouponForm action={createCouponAction} customers={customers} />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">最近优惠券</CardTitle>
          </CardHeader>
          <div className="scroll-area overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>客户</TableHead>
                  <TableHead>券信息</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      还没有优惠券，先发一张试试。
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <Link href={`/customers/${coupon.customer.id}`} className="font-medium text-foreground hover:text-primary">
                          {coupon.customer.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{coupon.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMoney(Number(coupon.value), coupon.type)}
                          {coupon.minSpend ? ` · 满 ${Number(coupon.minSpend)} 可用` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <p>{formatDate(coupon.validFrom)}</p>
                        <p>至 {formatDate(coupon.validUntil)}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${couponStatusConfig[coupon.status].className}`}>
                          {couponStatusConfig[coupon.status].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          {coupon.status === "UNUSED" ? (
                            <>
                              <form action={markCouponUsedAction.bind(null, coupon.id)}>
                                <SubmitButton size="sm" className="h-7 px-2.5 text-xs" pendingText="...">已用</SubmitButton>
                              </form>
                              <form action={markCouponExpiredAction.bind(null, coupon.id)}>
                                <SubmitButton size="sm" variant="ghost" className="h-7 px-2.5 text-xs" pendingText="...">过期</SubmitButton>
                              </form>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
