import Link from "next/link";
import { addDays, endOfDay, format, parse, startOfDay, subDays } from "date-fns";
import type { AppointmentStatus } from "@prisma/client";

import { advanceAppointmentStatusAction, cancelAppointmentAction } from "@/app/(dashboard)/appointments/actions";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";
import { appointmentStatusOptions } from "@/types/domain";

export const revalidate = 30;

type AppointmentsPageProps = {
  searchParams: Promise<{
    status?: string;
    view?: string;
    date?: string;
  }>;
};

const statusMap = {
  PENDING: { label: "待确认", className: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "已确认", className: "bg-sky-50 text-sky-700" },
  IN_SERVICE: { label: "服务中", className: "bg-violet-50 text-violet-700" },
  COMPLETED: { label: "已完成", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "已取消", className: "bg-slate-100 text-slate-600" },
} satisfies Record<AppointmentStatus, { label: string; className: string }>;

function nextActionText(status: AppointmentStatus) {
  switch (status) {
    case "PENDING":
      return "确认预约";
    case "CONFIRMED":
      return "开始服务";
    case "IN_SERVICE":
      return "完成服务";
    default:
      return null;
  }
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function safeParseDate(value?: string) {
  if (!value) {
    return new Date();
  }

  const parsed = parse(value, "yyyy-MM-dd", new Date());

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function buildAppointmentHref(input: { view: "list" | "calendar"; status: string; date?: string }) {
  const searchParams = new URLSearchParams();

  if (input.view !== "list") {
    searchParams.set("view", input.view);
  }

  if (input.status !== "ALL") {
    searchParams.set("status", input.status);
  }

  if (input.date) {
    searchParams.set("date", input.date);
  }

  const query = searchParams.toString();
  return query ? `/appointments?${query}` : "/appointments";
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const params = await searchParams;
  const status =
    params.status && appointmentStatusOptions.some((option) => option.value === params.status) ? params.status : "ALL";
  const view = params.view === "calendar" ? "calendar" : "list";
  const selectedDate = safeParseDate(params.date);
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDateStart = startOfDay(selectedDate);
  const selectedDateEnd = endOfDay(selectedDate);
  const previousDateKey = format(subDays(selectedDate, 1), "yyyy-MM-dd");
  const nextDateKey = format(addDays(selectedDate, 1), "yyyy-MM-dd");

  const where = {
    ...(status === "ALL" ? {} : { status: status as AppointmentStatus }),
    ...(view === "calendar" || params.date
      ? {
          scheduledDate: {
            gte: selectedDateStart,
            lte: selectedDateEnd,
          },
        }
      : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: view === "calendar" || params.date ? [{ startTime: "asc" }] : [{ scheduledDate: "desc" }, { startTime: "asc" }],
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
  });

  const timeSlots = Array.from({ length: 12 }, (_, index) => {
    const hour = 9 + index;
    return `${String(hour).padStart(2, "0")}:00`;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="预约管理"
        description="现在已经支持列表和日历两种视角：列表适合批量处理，日历适合看当天排班。"
        actions={
          <Button asChild>
            <Link href="/appointments/new">新建预约</Link>
          </Button>
        }
      />

      <div className="section-header">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={view === "list" ? "default" : "outline"} size="sm">
            <Link href={buildAppointmentHref({ view: "list", status, date: params.date })}>列表视图</Link>
          </Button>
          <Button asChild variant={view === "calendar" ? "default" : "outline"} size="sm">
            <Link href={buildAppointmentHref({ view: "calendar", status, date: selectedDateKey })}>日历视图</Link>
          </Button>
        </div>

        {view === "calendar" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={buildAppointmentHref({ view, status, date: previousDateKey })}>前一天</Link>
            </Button>
            <span className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
              {new Intl.DateTimeFormat("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                weekday: "short",
              }).format(selectedDate)}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={buildAppointmentHref({ view, status, date: nextDateKey })}>后一天</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={status === "ALL" ? "default" : "outline"} size="sm">
          <Link href={buildAppointmentHref({ view, status: "ALL", date: view === "calendar" ? selectedDateKey : params.date })}>全部</Link>
        </Button>
        {appointmentStatusOptions.map((option) => (
          <Button key={option.value} asChild variant={status === option.value ? "default" : "outline"} size="sm">
            <Link href={buildAppointmentHref({ view, status: option.value, date: view === "calendar" ? selectedDateKey : params.date })}>
              {option.label}
            </Link>
          </Button>
        ))}
      </div>

      {view === "calendar" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">当日排班</h2>
              <p className="mt-1 text-sm text-slate-500">按开始时间展示当天预约，适合店内快速看排班冲突。</p>
            </div>

            <div className="scroll-area max-h-[72vh] divide-y divide-slate-100 overflow-y-auto">
              {timeSlots.map((slot) => {
                const slotAppointments = appointments.filter((appointment) => format(appointment.startTime, "HH:00") === slot);

                return (
                  <div key={slot} className="grid gap-4 px-5 py-4 md:grid-cols-[80px_1fr]">
                    <div className="text-sm font-medium text-slate-500">{slot}</div>
                    <div>
                      {slotAppointments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">
                          当前时段暂无预约
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {slotAppointments.map((appointment) => {
                            const nextText = nextActionText(appointment.status);
                            const canCancel = appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED";

                            return (
                              <div key={appointment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <Link href={`/appointments/${appointment.id}`} className="text-sm font-semibold text-slate-900 underline">
                                      {appointment.appointmentNo}
                                    </Link>
                                    <p className="mt-1 text-sm text-slate-700">
                                      {appointment.customer.name} / {appointment.pet.name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {appointment.serviceItem.name} · {formatTime(appointment.startTime)} - {formatTime(appointment.endTime ?? appointment.startTime)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">员工：{appointment.staff?.name ?? "未分配"}</p>
                                  </div>
                                  <span className={`rounded-full px-3 py-1 text-xs ${statusMap[appointment.status].className}`}>
                                    {statusMap[appointment.status].label}
                                  </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/appointments/${appointment.id}`}>详情</Link>
                                  </Button>
                                  {nextText ? (
                                    <form action={advanceAppointmentStatusAction.bind(null, appointment.id)}>
                                      <SubmitButton size="sm" pendingText="处理中...">
                                        {nextText}
                                      </SubmitButton>
                                    </form>
                                  ) : null}
                                  {canCancel ? (
                                    <form action={cancelAppointmentAction.bind(null, appointment.id)}>
                                      <SubmitButton size="sm" variant="ghost" pendingText="处理中...">
                                        取消
                                      </SubmitButton>
                                    </form>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">当天摘要</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="info-row">
                  <dt>预约总数</dt>
                  <dd className="font-semibold text-slate-900">{appointments.length}</dd>
                </div>
                <div className="info-row">
                  <dt>待确认</dt>
                  <dd className="font-semibold text-slate-900">
                    {appointments.filter((appointment) => appointment.status === "PENDING").length}
                  </dd>
                </div>
                <div className="info-row">
                  <dt>服务中</dt>
                  <dd className="font-semibold text-slate-900">
                    {appointments.filter((appointment) => appointment.status === "IN_SERVICE").length}
                  </dd>
                </div>
                <div className="info-row">
                  <dt>已完成</dt>
                  <dd className="font-semibold text-slate-900">
                    {appointments.filter((appointment) => appointment.status === "COMPLETED").length}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">查看建议</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>日历视图更适合当天排班、看空闲时段和发现服务拥堵时间。</p>
                <p>如果你想批量处理状态、查历史预约，切回列表视图会更顺手。</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="scroll-area overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">预约编号</th>
                <th className="px-4 py-3 font-medium">客户 / 宠物</th>
                <th className="px-4 py-3 font-medium">服务</th>
                <th className="px-4 py-3 font-medium">预约时间</th>
                <th className="px-4 py-3 font-medium">员工</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    当前筛选条件下还没有预约，先新建一条预约把主链路走通。
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => {
                  const nextText = nextActionText(appointment.status);
                  const canCancel = appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED";

                  return (
                    <tr key={appointment.id}>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        <Link href={`/appointments/${appointment.id}`} className="underline">
                          {appointment.appointmentNo}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <Link href={`/customers/${appointment.customer.id}`} className="font-medium text-slate-900 underline">
                          {appointment.customer.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{appointment.pet.name}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{appointment.serviceItem.name}</td>
                      <td className="px-4 py-4 text-slate-600">
                        <p>{formatDateTime(appointment.startTime)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          预计结束 {formatTime(appointment.endTime ?? appointment.startTime)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{appointment.staff?.name ?? "未分配"}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs ${statusMap[appointment.status].className}`}>
                          {statusMap[appointment.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/appointments/${appointment.id}`}>详情</Link>
                          </Button>
                          {nextText ? (
                            <form action={advanceAppointmentStatusAction.bind(null, appointment.id)}>
                              <SubmitButton size="sm" pendingText="处理中...">
                                {nextText}
                              </SubmitButton>
                            </form>
                          ) : null}
                          {canCancel ? (
                            <form action={cancelAppointmentAction.bind(null, appointment.id)}>
                              <SubmitButton size="sm" variant="ghost" pendingText="处理中...">
                                取消
                              </SubmitButton>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
