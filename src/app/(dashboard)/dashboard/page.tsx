import Link from "next/link";
import { endOfDay, startOfDay, subDays } from "date-fns";
import type { AppointmentStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

const appointmentStatusMap = {
  PENDING: { label: "待确认", className: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "已确认", className: "bg-sky-50 text-sky-700" },
  IN_SERVICE: { label: "服务中", className: "bg-violet-50 text-violet-700" },
  COMPLETED: { label: "已完成", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "已取消", className: "bg-slate-100 text-slate-600" },
} satisfies Record<AppointmentStatus, { label: string; className: string }>;

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
    dormantCandidates,
    activeCoupons,
    activeServices,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    }),
    prisma.appointment.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
        updatedAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    }),
    prisma.followUpTask.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.followUpTask.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 3,
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        pet: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.appointment.findMany({
      where: {
        scheduledDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      orderBy: [{ startTime: "asc" }],
      take: 6,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        pet: {
          select: {
            name: true,
          },
        },
        serviceItem: {
          select: {
            name: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.customer.findMany({
      include: {
        appointments: {
          where: { status: "COMPLETED" },
          orderBy: { scheduledDate: "desc" },
          take: 1,
          select: {
            scheduledDate: true,
          },
        },
      },
    }),
    prisma.coupon.count({
      where: {
        status: "UNUSED",
      },
    }),
    prisma.serviceItem.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  const stats = [
    { label: "今日预约", value: String(todayAppointments) },
    { label: "待确认", value: String(pendingAppointments) },
    { label: "今日完成", value: String(todayCompleted) },
    { label: "待回访", value: String(pendingFollowUps) },
  ];

  const dormantCustomersCount = dormantCandidates.filter((customer) => {
    const lastCompleted = customer.appointments[0]?.scheduledDate;
    return lastCompleted && lastCompleted < dormantCutoff;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description="先把门店日常最重要的数据放上来，保证预约、履约和回访信息一眼可见。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/appointments/new">新建预约</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/operations">处理复购运营</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-slate-900">今日预约安排</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/appointments">查看全部预约</Link>
            </Button>
          </div>

          <div className="scroll-area overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 font-medium">客户 / 宠物</th>
                  <th className="px-4 py-3 font-medium">服务</th>
                  <th className="px-4 py-3 font-medium">员工</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAppointmentList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      今天还没有预约，先新建一条预约把工作台跑起来。
                    </td>
                  </tr>
                ) : (
                  todayAppointmentList.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-4 py-4 text-slate-700">
                        <p>{formatTime(appointment.startTime)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          结束 {formatTime(appointment.endTime ?? appointment.startTime)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        <Link href={`/customers/${appointment.customer.id}`} className="font-medium text-slate-900 underline">
                          {appointment.customer.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{appointment.pet.name}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{appointment.serviceItem.name}</td>
                      <td className="px-4 py-4 text-slate-700">{appointment.staff?.name ?? "未分配"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${appointmentStatusMap[appointment.status].className}`}
                        >
                          {appointmentStatusMap[appointment.status].label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">快捷入口</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/customers/new">新增客户</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/services/new">新增服务</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/appointments/new">新建预约</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/operations">去处理回访</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">经营提醒</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>沉睡客户</span>
                <span className="font-semibold text-slate-900">{dormantCustomersCount} 位</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>未使用优惠券</span>
                <span className="font-semibold text-slate-900">{activeCoupons} 张</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>启用中服务</span>
                <span className="font-semibold text-slate-900">{activeServices} 项</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="section-header">
              <h2 className="text-lg font-semibold text-slate-900">待处理回访</h2>
              <Button asChild size="sm" variant="outline">
                <Link href="/operations">查看全部</Link>
              </Button>
            </div>
            {recentFollowUps.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">当前没有待回访任务，说明最近的履约记录都还没挂出回访提醒。</p>
            ) : (
              <div className="scroll-area mt-4 max-h-72 space-y-3 overflow-y-auto pr-1 text-sm text-slate-600">
                {recentFollowUps.map((task) => (
                  <div key={task.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">
                      {task.customer.name}
                      {task.pet?.name ? ` / ${task.pet.name}` : ""}
                    </p>
                    <p className="mt-1">计划回访：{formatDay(task.dueDate)}</p>
                    <p className="mt-1 text-xs text-slate-500">{task.note || "暂无备注"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">演示账号</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>店长：`owner@petcarehub.local`</p>
              <p>店员：`staff@petcarehub.local`</p>
              <p>初始密码：`petcare123`</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
