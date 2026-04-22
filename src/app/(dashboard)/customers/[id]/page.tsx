import Link from "next/link";
import { notFound } from "next/navigation";
import type { CouponStatus, CouponType, FollowUpStatus } from "@prisma/client";

import {
  completeFollowUpTaskAction,
  markCouponExpiredAction,
  markCouponUsedAction,
  skipFollowUpTaskAction,
} from "@/app/(dashboard)/operations/actions";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";
import { petGenderOptions, petSizeOptions, petTypeOptions } from "@/lib/validations/pet";

export const revalidate = 30;

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

function optionLabel<T extends string>(options: ReadonlyArray<{ label: string; value: T }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "未填写";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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

const followUpStatusMap = {
  PENDING: { label: "待回访", className: "bg-amber-50 text-amber-700" },
  DONE: { label: "已完成", className: "bg-emerald-50 text-emerald-700" },
  SKIPPED: { label: "已跳过", className: "bg-slate-100 text-slate-600" },
} satisfies Record<FollowUpStatus, { label: string; className: string }>;

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      pets: { orderBy: { createdAt: "asc" } },
      appointments: {
        orderBy: { scheduledDate: "desc" },
        take: 5,
        include: {
          pet: { select: { name: true } },
          serviceItem: { select: { name: true } },
          visitRecord: {
            select: {
              nextSuggestedVisitAt: true,
            },
          },
        },
      },
      coupons: {
        orderBy: [{ createdAt: "desc" }],
        take: 8,
      },
      followUpTasks: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 8,
        include: {
          pet: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={customer.name}
        description={`${customer.phone}${customer.wechat ? ` · 微信 ${customer.wechat}` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/customers">返回列表</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/customers/${customer.id}/edit`}>编辑客户</Link>
            </Button>
            <Button asChild>
              <Link href={`/customers/${customer.id}/pets/new`}>新增宠物</Link>
            </Button>
          </div>
        }
      />

      {customer.note ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">客户备注</p>
          <p className="mt-2 whitespace-pre-wrap">{customer.note}</p>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-slate-900">客户运营</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/operations">去复购运营页</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-500">待回访</dt>
                <dd className="mt-2 text-2xl font-semibold text-slate-900">
                  {customer.followUpTasks.filter((task) => task.status === "PENDING").length}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">未使用优惠券</dt>
                <dd className="mt-2 text-2xl font-semibold text-slate-900">
                  {customer.coupons.filter((coupon) => coupon.status === "UNUSED").length}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">最近建议回店</dt>
                <dd className="mt-2 text-sm font-medium text-slate-900">
                  {formatDate(
                    customer.appointments.find((appointment) => appointment.visitRecord?.nextSuggestedVisitAt)?.visitRecord
                      ?.nextSuggestedVisitAt,
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">回访任务</h3>
            </div>
            <div className="scroll-area max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
              {customer.followUpTasks.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">这位客户还没有回访任务。</div>
              ) : (
                customer.followUpTasks.map((task) => (
                  <div key={task.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {task.pet?.name ? `${task.pet.name} / ` : ""}
                          {formatDate(task.dueDate)}
                        </p>
                        <p className="text-xs text-slate-500">{task.note || "无备注"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs ${followUpStatusMap[task.status].className}`}>
                        {followUpStatusMap[task.status].label}
                      </span>
                    </div>

                    {task.status === "PENDING" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
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
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-slate-900">客户优惠券</h2>
            <span className="text-sm text-slate-500">展示最近 8 张</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="scroll-area max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
              {customer.coupons.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">这位客户还没有优惠券。</div>
              ) : (
                customer.coupons.map((coupon) => (
                  <div key={coupon.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">{coupon.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatMoney(Number(coupon.value), coupon.type)}
                          {coupon.minSpend ? ` / 满 ${Number(coupon.minSpend)} 可用` : ""}
                        </p>
                        <p className="text-xs text-slate-500">
                          有效期：{formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                        </p>
                        {coupon.note ? <p className="text-xs text-slate-500">{coupon.note}</p> : null}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs ${couponStatusMap[coupon.status].className}`}>
                        {couponStatusMap[coupon.status].label}
                      </span>
                    </div>

                    {coupon.status === "UNUSED" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
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
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-semibold text-slate-900">宠物档案</h2>
          <span className="text-sm text-slate-500">共 {customer.pets.length} 只</span>
        </div>

        {customer.pets.length === 0 ? (
          <div className="empty-state rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500">
            <div>
              <p>这位客户还没有登记宠物。</p>
              <p className="mt-1 text-sm">
                <Link href={`/customers/${customer.id}/pets/new`} className="text-slate-900 underline">
                  去登记一只宠物
                </Link>
                ，才能创建预约。
              </p>
            </div>
          </div>
        ) : (
          <div className="grid items-stretch gap-4 md:grid-cols-2">
            {customer.pets.map((pet) => (
              <div key={pet.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{pet.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {optionLabel(petTypeOptions, pet.type)}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/customers/${customer.id}/pets/${pet.id}/edit`}>编辑</Link>
                  </Button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div>
                    <dt className="text-slate-500">性别</dt>
                    <dd>{optionLabel(petGenderOptions, pet.gender)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">体型</dt>
                    <dd>{optionLabel(petSizeOptions, pet.size)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">年龄</dt>
                    <dd>{pet.ageText || "未填"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">毛发</dt>
                    <dd className="truncate">{pet.coatCondition || "未填"}</dd>
                  </div>
                </dl>

                {pet.healthNote ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    健康：{pet.healthNote}
                  </p>
                ) : null}
                {pet.temperamentNote ? (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    性格：{pet.temperamentNote}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="section-header">
          <h2 className="text-lg font-semibold text-slate-900">最近预约</h2>
          <span className="text-sm text-slate-500">展示最近 5 条</span>
        </div>

        {customer.appointments.length === 0 ? (
          <div className="empty-state rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
            <div>暂无预约记录。预约模块做完后，这里会自动出现最近的到店履约情况。</div>
          </div>
        ) : (
          <div className="scroll-area overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">日期</th>
                  <th className="px-4 py-3">宠物</th>
                  <th className="px-4 py-3">服务</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customer.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-3">
                      {new Intl.DateTimeFormat("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }).format(appointment.scheduledDate)}
                    </td>
                    <td className="px-4 py-3">{appointment.pet.name}</td>
                    <td className="px-4 py-3">{appointment.serviceItem.name}</td>
                    <td className="px-4 py-3">{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
