import Link from "next/link";
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

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const params = await searchParams;
  const status =
    params.status && appointmentStatusOptions.some((option) => option.value === params.status) ? params.status : "ALL";

  const appointments = await prisma.appointment.findMany({
    where: status === "ALL" ? undefined : { status: status as AppointmentStatus },
    orderBy: [{ scheduledDate: "desc" }, { startTime: "asc" }],
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="预约管理"
        description="先把“创建预约 - 列表查看 - 状态流转”这条业务闭环跑通，后面再补日历视图和履约详情。"
        actions={
          <Button asChild>
            <Link href="/appointments/new">新建预约</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={status === "ALL" ? "default" : "outline"} size="sm">
          <Link href="/appointments">全部</Link>
        </Button>
        {appointmentStatusOptions.map((option) => (
          <Button key={option.value} asChild variant={status === option.value ? "default" : "outline"} size="sm">
            <Link href={`/appointments?status=${option.value}`}>{option.label}</Link>
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
                        预计结束 {new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(appointment.endTime ?? appointment.startTime)}
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
    </div>
  );
}
