import Link from "next/link";
import { differenceInCalendarDays, startOfDay, subDays } from "date-fns";
import type { CouponStatus, CouponType } from "@prisma/client";

import {
  completeFollowUpTaskAction,
  createCouponAction,
  markCouponExpiredAction,
  markCouponUsedAction,
  skipFollowUpTaskAction,
} from "@/app/(dashboard)/operations/actions";
import { PageHeader } from "@/components/common/page-header";
import { CouponForm } from "@/components/operations/coupon-form";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

function formatDate(date: Date | null | undefined) {
  if (!date) return "未填写";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysSince(date: Date) {
  return Math.max(0, differenceInCalendarDays(startOfDay(new Date()), startOfDay(date)));
}

function followUpDueText(date: Date) {
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));

  if (diff > 0) {
    return `距今还有 ${diff} 天`;
  }

  if (diff < 0) {
    return `已逾期 ${Math.abs(diff)} 天`;
  }

  return "今天回访";
}

function formatMoney(value: number | null | undefined, type: CouponType = "CASH") {
  if (value === null || value === undefined) {
    return "未填写";
  }

  if (type === "DISCOUNT") {
    return `${value} 折`;
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

const couponStatusMap = {
  UNUSED: { label: "未使用", className: "bg-amber-50 text-amber-700" },
  USED: { label: "已使用", className: "bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "已过期", className: "bg-slate-100 text-slate-600" },
} satisfies Record<CouponStatus, { label: string; className: string }>;

export default async function OperationsPage() {
  const dormantCutoff = subDays(new Date(), 30);

  const [pendingTasks, pendingCount, doneCount, skippedCount, dormantCandidates, activeCoupons, customers, coupons] =
    await Promise.all([
    prisma.followUpTask.findMany({
      where: { status: "PENDING" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        pet: {
          select: {
            name: true,
          },
        },
      },
      take: 20,
    }),
    prisma.followUpTask.count({
      where: { status: "PENDING" },
    }),
    prisma.followUpTask.count({
      where: { status: "DONE" },
    }),
    prisma.followUpTask.count({
      where: { status: "SKIPPED" },
    }),
    prisma.customer.findMany({
      include: {
        pets: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
          },
        },
        appointments: {
          where: { status: "COMPLETED" },
          orderBy: { scheduledDate: "desc" },
          take: 1,
          select: {
            id: true,
            scheduledDate: true,
            serviceItem: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.coupon.count({
      where: {
        status: "UNUSED",
      },
    }),
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    }),
    prisma.coupon.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 12,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  const dormantCustomers = dormantCandidates
    .filter((customer) => {
      const lastCompleted = customer.appointments[0]?.scheduledDate;
      return lastCompleted && lastCompleted < dormantCutoff;
    })
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      petsLabel: customer.pets.map((pet) => pet.name).join("、") || "暂无宠物",
      lastCompletedAt: customer.appointments[0]!.scheduledDate,
      lastServiceName: customer.appointments[0]!.serviceItem.name,
    }))
    .sort((a, b) => a.lastCompletedAt.getTime() - b.lastCompletedAt.getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        title="复购运营"
        description="把履约后的回访提醒和沉睡客户筛选放在同一页，先跑通最小复购闭环。"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">待回访</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">已完成回访</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{doneCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">沉睡客户</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{dormantCustomers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">未使用优惠券</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{activeCoupons}</p>
          <p className="mt-2 text-xs text-slate-500">已跳过回访 {skippedCount} 条</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-slate-900">待回访任务</h2>
            <span className="text-sm text-slate-500">按到期时间升序展示</span>
          </div>

          <div className="scroll-area overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">客户</th>
                  <th className="px-4 py-3 font-medium">宠物</th>
                  <th className="px-4 py-3 font-medium">计划回访日</th>
                  <th className="px-4 py-3 font-medium">备注</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      暂无待回访任务。去预约详情页填写下次建议到店时间后，这里会自动生成任务。
                    </td>
                  </tr>
                ) : (
                  pendingTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 py-4">
                        <Link href={`/customers/${task.customer.id}`} className="font-medium text-slate-900 underline">
                          {task.customer.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{task.customer.phone}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{task.pet?.name ?? "未指定"}</td>
                      <td className="px-4 py-4 text-slate-600">
                        <p>{formatDate(task.dueDate)}</p>
                        <p className="mt-1 text-xs text-slate-500">{followUpDueText(task.dueDate)}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{task.note || "无"}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <form action={completeFollowUpTaskAction.bind(null, task.id)}>
                            <SubmitButton size="sm" pendingText="处理中...">
                              标记完成
                            </SubmitButton>
                          </form>
                          <form action={skipFollowUpTaskAction.bind(null, task.id)}>
                            <SubmitButton size="sm" variant="ghost" pendingText="处理中...">
                              跳过
                            </SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-slate-900">沉睡客户筛选</h2>
            <span className="text-sm text-slate-500">超过 30 天未完成服务</span>
          </div>

          {dormantCustomers.length === 0 ? (
            <div className="empty-state rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
              <div>当前没有沉睡客户，说明最近复购情况还不错。</div>
            </div>
          ) : (
            <div className="scroll-area max-h-[34rem] space-y-3 overflow-y-auto pr-1">
              {dormantCustomers.map((customer) => (
                <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/customers/${customer.id}`} className="text-base font-semibold text-slate-900 underline">
                        {customer.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">{customer.phone}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                      {daysSince(customer.lastCompletedAt)} 天未到店
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="info-row">
                      <dt>宠物</dt>
                      <dd>{customer.petsLabel}</dd>
                    </div>
                    <div className="info-row">
                      <dt>最近完成服务</dt>
                      <dd>{customer.lastServiceName}</dd>
                    </div>
                    <div className="info-row">
                      <dt>最近到店日期</dt>
                      <dd>{formatDate(customer.lastCompletedAt)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/customers/${customer.id}`}>查看客户详情</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-slate-900">手动发券</h2>
            <span className="text-sm text-slate-500">先做单张发券，足够支撑演示</span>
          </div>

          <CouponForm action={createCouponAction} customers={customers} />
        </div>

        <div className="space-y-4">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-slate-900">最近优惠券</h2>
            <span className="text-sm text-slate-500">展示最近 12 条</span>
          </div>

          <div className="scroll-area overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">客户</th>
                  <th className="px-4 py-3 font-medium">券信息</th>
                  <th className="px-4 py-3 font-medium">有效期</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      还没有优惠券，先发一张回店券试试。
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-4 py-4">
                        <Link href={`/customers/${coupon.customer.id}`} className="font-medium text-slate-900 underline">
                          {coupon.customer.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{coupon.customer.phone}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <p className="font-medium text-slate-900">{coupon.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatMoney(Number(coupon.value), coupon.type)}
                          {coupon.minSpend ? ` / 满 ${Number(coupon.minSpend)} 可用` : ""}
                        </p>
                        {coupon.note ? <p className="mt-1 text-xs text-slate-500">{coupon.note}</p> : null}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <p>起：{formatDate(coupon.validFrom)}</p>
                        <p className="mt-1 text-xs text-slate-500">止：{formatDate(coupon.validUntil)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs ${couponStatusMap[coupon.status].className}`}>
                          {couponStatusMap[coupon.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {coupon.status === "UNUSED" ? (
                            <>
                              <form action={markCouponUsedAction.bind(null, coupon.id)}>
                                <SubmitButton size="sm" pendingText="处理中...">
                                  标记已用
                                </SubmitButton>
                              </form>
                              <form action={markCouponExpiredAction.bind(null, coupon.id)}>
                                <SubmitButton size="sm" variant="ghost" pendingText="处理中...">
                                  标记过期
                                </SubmitButton>
                              </form>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">无需操作</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
