import { endOfDay, startOfDay } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

export default async function DashboardPage() {
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const [todayAppointments, pendingAppointments, todayCompleted, pendingFollowUps, recentFollowUps] = await Promise.all([
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
  ]);

  const stats = [
    { label: "今日预约", value: String(todayAppointments) },
    { label: "待确认", value: String(pendingAppointments) },
    { label: "今日完成", value: String(todayCompleted) },
    { label: "待回访", value: String(pendingFollowUps) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description="先把门店日常最重要的数据放上来，保证预约、履约和回访信息一眼可见。"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">待处理回访</h2>
          {recentFollowUps.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">当前没有待回访任务，说明最近的履约记录都还没挂出回访提醒。</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {recentFollowUps.map((task) => (
                <div key={task.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">
                    {task.customer.name}
                    {task.pet?.name ? ` / ${task.pet.name}` : ""}
                  </p>
                  <p className="mt-1">计划回访：{new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(task.dueDate)}</p>
                  <p className="mt-1 text-xs text-slate-500">{task.note || "暂无备注"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">演示账号</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>店长：`owner@petcarehub.local`</p>
            <p>店员：`staff@petcarehub.local`</p>
            <p>初始密码：`petcare123`</p>
          </div>
        </div>
      </section>
    </div>
  );
}
