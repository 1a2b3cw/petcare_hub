import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PawPrint, Phone, Plus, Tag } from "lucide-react";
import type { AppointmentStatus, CouponStatus, CouponType, FollowUpStatus } from "@prisma/client";

import {
  completeFollowUpTaskAction,
  markCouponExpiredAction,
  markCouponUsedAction,
  skipFollowUpTaskAction,
} from "@/app/(dashboard)/operations/actions";
import { PageHeader } from "@/components/common/page-header";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { petGenderOptions, petSizeOptions, petTypeOptions } from "@/lib/validations/pet";

export const revalidate = 30;

type Props = { params: Promise<{ id: string }> };

function optionLabel<T extends string>(opts: ReadonlyArray<{ label: string; value: T }>, value: T) {
  return opts.find((o) => o.value === value)?.label ?? value;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "未填写";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function formatMoney(value: number | null | undefined, type: CouponType = "CASH") {
  if (value == null) return "未填写";
  if (type === "DISCOUNT") return `${value} 折`;
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 0 }).format(value);
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
        take: 6,
        include: {
          pet: { select: { name: true } },
          serviceItem: { select: { name: true } },
          visitRecord: { select: { nextSuggestedVisitAt: true } },
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

  const pendingFollowUps = customer.followUpTasks.filter((t) => t.status === "PENDING").length;
  const unusedCoupons = customer.coupons.filter((c) => c.status === "UNUSED").length;
  const nextVisit = customer.appointments.find((a) => a.visitRecord?.nextSuggestedVisitAt)
    ?.visitRecord?.nextSuggestedVisitAt;

  return (
    <div className="space-y-6">
      <SearchParamToast />
      <PageHeader
        title={customer.name}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">
                <ArrowLeft className="h-3.5 w-3.5" /> 返回列表
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/customers/${customer.id}/edit`}>编辑资料</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/customers/${customer.id}/pets/new`}>
                <Plus className="h-3.5 w-3.5" /> 新增宠物
              </Link>
            </Button>
          </div>
        }
      />

      {/* 客户基本信息 */}
      <Card className="border shadow-sm">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {customer.name.slice(0, 1)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">{customer.name}</h2>
                {customer.pets.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {customer.pets.map((p) => (
                      <Badge key={p.id} variant="secondary" className="gap-1 text-xs">
                        <PawPrint className="h-2.5 w-2.5" />{p.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </span>
                {customer.wechat && <span>微信：{customer.wechat}</span>}
              </div>
              {customer.note && (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {customer.note}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 运营数据摘要 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "待回访", value: pendingFollowUps, unit: "条", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "未使用券", value: unusedCoupons, unit: "张", color: "text-violet-600", bg: "bg-violet-50" },
          { label: "建议回店", value: nextVisit ? formatDate(nextVisit) : "暂无", unit: "", color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((item) => (
          <Card key={item.label} className="border shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>
                {item.value}{item.unit && <span className="ml-0.5 text-sm font-normal">{item.unit}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 宠物档案 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            宠物档案 <span className="ml-1 text-sm font-normal text-muted-foreground">{customer.pets.length} 只</span>
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link href={`/customers/${customer.id}/pets/new`}>
              <Plus className="h-3.5 w-3.5" /> 新增
            </Link>
          </Button>
        </div>

        {customer.pets.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex min-h-28 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <PawPrint className="h-7 w-7 opacity-25" />
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

      {/* 回访任务 + 优惠券 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 回访任务 */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">回访任务</CardTitle>
          </CardHeader>
          <CardContent className="scroll-area max-h-80 divide-y overflow-y-auto p-0">
            {customer.followUpTasks.length === 0 ? (
              <div className="flex min-h-28 items-center justify-center text-sm text-muted-foreground">
                暂无回访任务
              </div>
            ) : (
              customer.followUpTasks.map((task) => {
                const cfg = followUpStatusConfig[task.status];
                return (
                  <div key={task.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {task.pet?.name ? `${task.pet.name} · ` : ""}
                          {formatDate(task.dueDate)}
                        </p>
                        {task.note && <p className="mt-0.5 text-xs text-muted-foreground">{task.note}</p>}
                      </div>
                      <span className={`flex-none rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {task.status === "PENDING" && (
                      <div className="mt-2 flex gap-1.5">
                        <form action={completeFollowUpTaskAction.bind(null, task.id)}>
                          <SubmitButton size="sm" className="h-6 px-2 text-xs" pendingText="...">完成</SubmitButton>
                        </form>
                        <form action={skipFollowUpTaskAction.bind(null, task.id)}>
                          <SubmitButton size="sm" variant="ghost" className="h-6 px-2 text-xs" pendingText="...">跳过</SubmitButton>
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
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">优惠券</CardTitle>
              <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                <Link href="/operations">
                  <Tag className="h-3 w-3" /> 去发券
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="scroll-area max-h-80 divide-y overflow-y-auto p-0">
            {customer.coupons.length === 0 ? (
              <div className="flex min-h-28 items-center justify-center text-sm text-muted-foreground">
                暂无优惠券
              </div>
            ) : (
              customer.coupons.map((coupon) => {
                const cfg = couponStatusConfig[coupon.status];
                return (
                  <div key={coupon.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{coupon.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatMoney(Number(coupon.value), coupon.type)}
                          {coupon.minSpend ? ` · 满 ${Number(coupon.minSpend)} 用` : ""}
                          {" · "}至 {formatDate(coupon.validUntil)}
                        </p>
                      </div>
                      <span className={`flex-none rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {coupon.status === "UNUSED" && (
                      <div className="mt-2 flex gap-1.5">
                        <form action={markCouponUsedAction.bind(null, coupon.id)}>
                          <SubmitButton size="sm" className="h-6 px-2 text-xs" pendingText="...">已用</SubmitButton>
                        </form>
                        <form action={markCouponExpiredAction.bind(null, coupon.id)}>
                          <SubmitButton size="sm" variant="ghost" className="h-6 px-2 text-xs" pendingText="...">过期</SubmitButton>
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

      {/* 最近预约 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">最近预约</h2>
        <Card className="border shadow-sm">
          <div className="scroll-area overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>日期</TableHead>
                  <TableHead>宠物</TableHead>
                  <TableHead>服务</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      暂无预约记录
                    </TableCell>
                  </TableRow>
                ) : (
                  customer.appointments.map((appt) => {
                    const cfg = apptStatusConfig[appt.status];
                    return (
                      <TableRow key={appt.id}>
                        <TableCell className="text-sm">
                          {new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(appt.scheduledDate)}
                        </TableCell>
                        <TableCell className="text-sm">{appt.pet.name}</TableCell>
                        <TableCell className="text-sm">{appt.serviceItem.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <Link href={`/appointments/${appt.id}`}>详情</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </div>
  );
}
