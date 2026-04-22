import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  PawPrint,
  Phone,
  Plus,
  Tag,
  Ticket,
} from "lucide-react";
import type { AppointmentStatus, CouponStatus, CouponType, FollowUpStatus } from "@prisma/client";

import {
  completeFollowUpTaskAction,
  markCouponExpiredAction,
  markCouponUsedAction,
  skipFollowUpTaskAction,
} from "@/app/(dashboard)/operations/actions";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";
import { petGenderOptions, petSizeOptions, petTypeOptions } from "@/lib/validations/pet";

export const revalidate = 30;

type Props = { params: Promise<{ id: string }> };

function optionLabel<T extends string>(opts: ReadonlyArray<{ label: string; value: T }>, value: T) {
  return opts.find((o) => o.value === value)?.label ?? value;
}

function formatDate(date: Date | null | undefined, short = false) {
  if (!date) return "未填写";
  return new Intl.DateTimeFormat("zh-CN", {
    year: short ? undefined : "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatMoney(value: number | null | undefined, type: CouponType = "CASH") {
  if (value == null) return "未填写";
  if (type === "DISCOUNT") return `${value} 折`;
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }).format(value);
}

const apptStatusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING:    { label: "待确认", className: "border-amber-200 bg-amber-50 text-amber-700" },
  CONFIRMED:  { label: "已确认", className: "border-sky-200 bg-sky-50 text-sky-700" },
  IN_SERVICE: { label: "服务中", className: "border-violet-200 bg-violet-50 text-violet-700" },
  COMPLETED:  { label: "已完成", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  CANCELLED:  { label: "已取消", className: "border-border bg-muted text-muted-foreground" },
};

const couponStatusConfig: Record<CouponStatus, { label: string; className: string }> = {
  UNUSED:  { label: "未使用", className: "border-amber-200 bg-amber-50 text-amber-700" },
  USED:    { label: "已使用", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "已过期", className: "border-border bg-muted text-muted-foreground" },
};

const followUpStatusConfig: Record<FollowUpStatus, { label: string; className: string }> = {
  PENDING: { label: "待回访", className: "border-amber-200 bg-amber-50 text-amber-700" },
  DONE:    { label: "已完成", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  SKIPPED: { label: "已跳过", className: "border-border bg-muted text-muted-foreground" },
};


export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      pets: { orderBy: { createdAt: "asc" } },
      appointments: {
        orderBy: { scheduledDate: "desc" },
        take: 8,
        include: {
          pet: { select: { name: true } },
          serviceItem: { select: { name: true } },
          visitRecord: { select: { actualAmount: true, nextSuggestedVisitAt: true } },
        },
      },
      coupons: { orderBy: [{ createdAt: "desc" }], take: 8 },
      followUpTasks: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 8,
        include: { pet: { select: { name: true } } },
      },
    },
  });

  if (!customer) notFound();

  const completedAppts = customer.appointments.filter((a) => a.status === "COMPLETED");
  const totalSpend = completedAppts.reduce(
    (sum, a) => sum + Number(a.visitRecord?.actualAmount ?? 0),
    0,
  );
  const pendingFollowUps = customer.followUpTasks.filter((t) => t.status === "PENDING").length;
  const unusedCoupons = customer.coupons.filter((c) => c.status === "UNUSED").length;
  const nextVisit = customer.appointments.find((a) => a.visitRecord?.nextSuggestedVisitAt)
    ?.visitRecord?.nextSuggestedVisitAt;
  const lastVisit = completedAppts[0]?.scheduledDate;

  return (
    <div className="space-y-6">
      <SearchParamToast />

      {/* ── 顶部返回条 ── */}
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost" className="-ml-1 gap-1 text-muted-foreground hover:text-foreground">
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
            客户列表
          </Link>
        </Button>
      </div>

      {/* ── 客户 Hero 卡片 ── */}
      <Card className="overflow-hidden border shadow-sm">
        {/* 顶部色带 */}
        <div className="h-2 w-full bg-gradient-to-r from-teal-500 to-emerald-400" />
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            {/* 左侧：头像 + 信息 */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 text-2xl font-bold text-white shadow-sm">
                {customer.name.slice(0, 1)}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </span>
                  {customer.wechat && (
                    <span className="flex items-center gap-1">
                      微信：{customer.wechat}
                    </span>
                  )}
                </div>
                {/* 宠物标签 */}
                {customer.pets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {customer.pets.map((p) => (
                      <Badge key={p.id} variant="secondary" className="gap-1 text-xs">
                        <PawPrint className="h-2.5 w-2.5" />
                        {p.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {customer.note && (
                  <p className="mt-1 max-w-sm rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                    {customer.note}
                  </p>
                )}
              </div>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/customers/${customer.id}/edit`}>
                  编辑资料
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href={`/customers/${customer.id}/pets/new`}>
                  <Plus className="h-3.5 w-3.5" />
                  新增宠物
                </Link>
              </Button>
            </div>
          </div>

          {/* 统计行 */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-5 sm:grid-cols-4">
            {[
              {
                label: "累计到店",
                value: `${completedAppts.length} 次`,
                icon: CheckCircle2,
                color: "text-emerald-600",
              },
              {
                label: "累计消费",
                value: totalSpend > 0
                  ? new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 0 }).format(totalSpend)
                  : "—",
                icon: Tag,
                color: "text-sky-600",
              },
              {
                label: "上次到店",
                value: lastVisit ? formatDate(lastVisit, true) : "暂无",
                icon: Clock,
                color: "text-amber-600",
              },
              {
                label: "建议回店",
                value: nextVisit ? formatDate(nextVisit, true) : "暂无",
                icon: CalendarDays,
                color: "text-violet-600",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-muted">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 宠物档案 ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            宠物档案
            <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {customer.pets.length}
            </span>
          </h2>
          <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs">
            <Link href={`/customers/${customer.id}/pets/new`}>
              <Plus className="h-3.5 w-3.5" /> 新增
            </Link>
          </Button>
        </div>

        {customer.pets.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex min-h-24 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <PawPrint className="h-7 w-7 opacity-20" />
              <p>还没有宠物档案</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {customer.pets.map((pet) => (
              <Card key={pet.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{pet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {optionLabel(petTypeOptions, pet.type)}
                        {pet.breed ? ` · ${pet.breed}` : ""}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Link href={`/customers/${customer.id}/pets/${pet.id}/edit`}>编辑</Link>
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {[
                      { label: "性别", value: optionLabel(petGenderOptions, pet.gender) },
                      { label: "体型", value: optionLabel(petSizeOptions, pet.size) },
                      { label: "年龄", value: pet.ageText || "未填" },
                      { label: "毛发", value: pet.coatCondition || "未填" },
                    ].map((item) => (
                      <div key={item.label}>
                        <span className="text-muted-foreground">{item.label}：</span>
                        <span className="text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {pet.healthNote && (
                    <p className="mt-2.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                      健康：{pet.healthNote}
                    </p>
                  )}
                  {pet.temperamentNote && (
                    <p className="mt-1.5 rounded bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                      性格：{pet.temperamentNote}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── 回访任务 + 优惠券 ── */}
      <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">运营记录</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 回访任务 */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b px-5 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                回访任务
                {pendingFollowUps > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {pendingFollowUps} 待处理
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="max-h-72 divide-y overflow-y-auto p-0">
            {customer.followUpTasks.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
                暂无回访任务
              </div>
            ) : (
              customer.followUpTasks.map((task) => {
                const cfg = followUpStatusConfig[task.status];
                const isOverdue = task.status === "PENDING" && task.dueDate < new Date();
                return (
                  <div key={task.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {task.pet?.name && (
                            <span className="flex-none rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {task.pet.name}
                            </span>
                          )}
                          <p className={`text-sm font-medium ${isOverdue ? "text-rose-600" : "text-foreground"}`}>
                            {formatDate(task.dueDate)}
                            {isOverdue && <span className="ml-1 text-xs font-normal">已逾期</span>}
                          </p>
                        </div>
                        {task.note && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.note}</p>
                        )}
                      </div>
                      <span className={`flex-none rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {task.status === "PENDING" && (
                      <div className="mt-2 flex gap-1.5">
                        <form action={completeFollowUpTaskAction.bind(null, task.id)}>
                          <SubmitButton size="sm" className="h-6 px-2.5 text-xs" pendingText="…">
                            完成
                          </SubmitButton>
                        </form>
                        <form action={skipFollowUpTaskAction.bind(null, task.id)}>
                          <SubmitButton size="sm" variant="ghost" className="h-6 px-2.5 text-xs" pendingText="…">
                            跳过
                          </SubmitButton>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 优惠券 */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b px-5 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                优惠券
                {unusedCoupons > 0 && (
                  <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {unusedCoupons} 可用
                  </span>
                )}
              </CardTitle>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs">
                <Link href="/operations">
                  <Ticket className="h-3.5 w-3.5" />
                  去发券
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-72 divide-y overflow-y-auto p-0">
            {customer.coupons.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
                暂无优惠券
              </div>
            ) : (
              customer.coupons.map((coupon) => {
                const cfg = couponStatusConfig[coupon.status];
                return (
                  <div key={coupon.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{coupon.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {formatMoney(Number(coupon.value), coupon.type)}
                          </span>
                          {coupon.minSpend ? ` · 满 ${Number(coupon.minSpend)} 用` : ""}
                          {coupon.validUntil ? ` · 至 ${formatDate(coupon.validUntil, true)}` : ""}
                        </p>
                      </div>
                      <span className={`flex-none rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {coupon.status === "UNUSED" && (
                      <div className="mt-2 flex gap-1.5">
                        <form action={markCouponUsedAction.bind(null, coupon.id)}>
                          <SubmitButton size="sm" className="h-6 px-2.5 text-xs" pendingText="…">已用</SubmitButton>
                        </form>
                        <form action={markCouponExpiredAction.bind(null, coupon.id)}>
                          <SubmitButton size="sm" variant="ghost" className="h-6 px-2.5 text-xs" pendingText="…">过期</SubmitButton>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
      </section>

      {/* ── 预约历史 ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            预约历史
            <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              最近 {customer.appointments.length} 条
            </span>
          </h2>
          <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs">
            <Link href={`/appointments/new?customerId=${customer.id}`}>
              <Plus className="h-3.5 w-3.5" /> 新建预约
            </Link>
          </Button>
        </div>

        {customer.appointments.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex min-h-24 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-7 w-7 opacity-20" />
              <p>暂无预约记录</p>
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y rounded-xl border bg-card shadow-sm">
            {customer.appointments.map((appt) => {
              const cfg = apptStatusConfig[appt.status];
              return (
                <Link
                  key={appt.id}
                  href={`/appointments/${appt.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  {/* 日期块 */}
                  <div className="flex w-12 flex-none flex-col items-center rounded-lg bg-muted/50 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      {appt.scheduledDate.getMonth() + 1}月
                    </p>
                    <p className="text-base font-bold leading-none text-foreground">
                      {appt.scheduledDate.getDate()}
                    </p>
                  </div>

                  {/* 主信息 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {appt.serviceItem.name}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">· {appt.pet.name}</span>
                    </p>
                    {appt.visitRecord?.actualAmount && (
                      <p className="text-xs text-muted-foreground">
                        实收 {new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 0 }).format(Number(appt.visitRecord.actualAmount))}
                      </p>
                    )}
                  </div>

                  {/* 状态 + 箭头 */}
                  <div className="flex flex-none items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                      {cfg.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
