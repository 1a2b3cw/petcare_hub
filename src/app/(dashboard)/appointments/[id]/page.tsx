import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { saveVisitRecordAction } from "@/app/(dashboard)/appointments/actions";
import { VisitRecordForm } from "@/components/appointments/visit-record-form";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

type AppointmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "未记录";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "未填写";
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "待确认";
    case "CONFIRMED":
      return "已确认";
    case "IN_SERVICE":
      return "服务中";
    case "COMPLETED":
      return "已完成";
    case "CANCELLED":
      return "已取消";
    default:
      return status;
  }
}

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const { id } = await params;

  const [appointment, staffOptions] = await Promise.all([
    prisma.appointment.findUnique({
      where: { id },
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
            breed: true,
            ageText: true,
          },
        },
        serviceItem: {
          select: {
            name: true,
            price: true,
            durationMinutes: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
        visitRecord: {
          include: {
            staff: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!appointment) {
    notFound();
  }

  const canEditVisitRecord = appointment.status === "IN_SERVICE" || appointment.status === "COMPLETED";
  const visitRecord = appointment.visitRecord;

  return (
    <div className="space-y-8">
      <PageHeader
        title={appointment.appointmentNo}
        description={`${appointment.customer.name} / ${appointment.pet.name} / ${statusLabel(appointment.status)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/appointments">返回预约列表</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/customers/${appointment.customer.id}`}>查看客户档案</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">预约基础信息</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">客户</dt>
                <dd className="mt-1 text-sm text-slate-800">{appointment.customer.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">手机号</dt>
                <dd className="mt-1 text-sm text-slate-800">{appointment.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">宠物</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {appointment.pet.name}
                  {appointment.pet.breed ? ` / ${appointment.pet.breed}` : ""}
                  {appointment.pet.ageText ? ` / ${appointment.pet.ageText}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">服务项目</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {appointment.serviceItem.name} / {appointment.serviceItem.durationMinutes} 分钟
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">预约开始</dt>
                <dd className="mt-1 text-sm text-slate-800">{formatDateTime(appointment.startTime)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">预约结束</dt>
                <dd className="mt-1 text-sm text-slate-800">{formatDateTime(appointment.endTime)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">预约员工</dt>
                <dd className="mt-1 text-sm text-slate-800">{appointment.staff?.name ?? "未分配"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">预约备注</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{appointment.remark || "无"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">履约记录摘要</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">到店时间</dt>
                <dd className="mt-1 text-sm text-slate-800">{formatDateTime(visitRecord?.checkInAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">完成时间</dt>
                <dd className="mt-1 text-sm text-slate-800">{formatDateTime(visitRecord?.completedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">实际服务</dt>
                <dd className="mt-1 text-sm text-slate-800">{visitRecord?.actualServiceName || "未填写"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">实际金额</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {formatMoney(visitRecord?.actualAmount ? Number(visitRecord.actualAmount) : Number(appointment.serviceItem.price))}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">履约员工</dt>
                <dd className="mt-1 text-sm text-slate-800">{visitRecord?.staff?.name ?? appointment.staff?.name ?? "未填写"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">下次建议到店</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {visitRecord?.nextSuggestedVisitAt
                    ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(
                        visitRecord.nextSuggestedVisitAt,
                      )
                    : "未填写"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-900">服务记录</p>
                <p className="mt-1 whitespace-pre-wrap">{visitRecord?.serviceNote || "暂未填写。"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">宠物状态备注</p>
                <p className="mt-1 whitespace-pre-wrap">{visitRecord?.petConditionNote || "暂未填写。"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">当前状态</h2>
            <p className="mt-3 text-sm text-slate-600">
              当前预约处于 <span className="font-medium text-slate-900">{statusLabel(appointment.status)}</span>。
              {canEditVisitRecord
                ? " 现在可以补充到店后的履约信息。"
                : " 当状态进入“服务中”后，这里会开放履约记录编辑。"}
            </p>
          </div>

          {canEditVisitRecord ? (
            <VisitRecordForm
              action={saveVisitRecordAction.bind(null, appointment.id)}
              staffOptions={staffOptions}
              defaultValues={{
                actualServiceName: visitRecord?.actualServiceName ?? appointment.serviceItem.name,
                actualAmount: visitRecord?.actualAmount
                  ? Number(visitRecord.actualAmount).toString()
                  : Number(appointment.serviceItem.price).toString(),
                staffId: visitRecord?.staffId ?? appointment.staffId ?? "",
                serviceNote: visitRecord?.serviceNote ?? "",
                petConditionNote: visitRecord?.petConditionNote ?? "",
                nextSuggestedVisitAt: visitRecord?.nextSuggestedVisitAt
                  ? format(visitRecord.nextSuggestedVisitAt, "yyyy-MM-dd")
                  : "",
              }}
            />
          ) : (
            <div className="empty-state rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
              <div>先在预约列表里把状态推进到“服务中”，这里才会开放履约记录表单。</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
