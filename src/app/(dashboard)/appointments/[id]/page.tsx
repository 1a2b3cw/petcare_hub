import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, Clock, FileText, User } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";

import { advanceAppointmentStatusAction, cancelAppointmentAction, saveVisitRecordAction } from "@/app/(dashboard)/appointments/actions";
import { VisitRecordForm } from "@/components/appointments/visit-record-form";
import { PageHeader } from "@/components/common/page-header";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

type Props = { params: Promise<{ id: string }> };

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING:    { label: "待确认", className: "border-amber-200 bg-amber-50 text-amber-700" },
  CONFIRMED:  { label: "已确认", className: "border-sky-200 bg-sky-50 text-sky-700" },
  IN_SERVICE: { label: "服务中", className: "border-violet-200 bg-violet-50 text-violet-700" },
  COMPLETED:  { label: "已完成", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  CANCELLED:  { label: "已取消", className: "border-border bg-muted text-muted-foreground" },
};

function nextActionText(status: AppointmentStatus) {
  if (status === "PENDING")   return "确认预约";
  if (status === "CONFIRMED") return "开始服务";
  if (status === "IN_SERVICE") return "完成服务";
  return null;
}

function fmt(date: Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return "未记录";
  return new Intl.DateTimeFormat("zh-CN", opts ?? {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function fmtMoney(value: number | null | undefined) {
  if (value == null) return "未填写";
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 0 }).format(value);
}

type InfoItem = { label: string; value: string };
function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params;

  const [appointment, staffOptions] = await Promise.all([
    prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { name: true, breed: true, ageText: true } },
        serviceItem: { select: { name: true, price: true, durationMinutes: true } },
        staff: { select: { name: true } },
        visitRecord: { include: { staff: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!appointment) notFound();

  const cfg = statusConfig[appointment.status];
  const canEditVisit = appointment.status === "IN_SERVICE" || appointment.status === "COMPLETED";
  const canCancel = appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED";
  const nextText = nextActionText(appointment.status);
  const vr = appointment.visitRecord;

  return (
    <div className="space-y-6">
      <SearchParamToast />
      <PageHeader
        title={appointment.appointmentNo}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/appointments">
                <ArrowLeft className="h-3.5 w-3.5" /> 返回列表
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/customers/${appointment.customer.id}`}>客户档案</Link>
            </Button>
            {nextText && (
              <form action={advanceAppointmentStatusAction.bind(null, appointment.id)}>
                <SubmitButton size="sm" pendingText="处理中...">{nextText}</SubmitButton>
              </form>
            )}
            {canCancel && (
              <form action={cancelAppointmentAction.bind(null, appointment.id)}>
                <SubmitButton size="sm" variant="outline" pendingText="处理中...">取消预约</SubmitButton>
              </form>
            )}
          </div>
        }
      />

      {/* 状态 + 编号 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${cfg.className}`}>
          {cfg.label}
        </span>
        <span className="font-mono text-sm text-muted-foreground">{appointment.appointmentNo}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* 左列 */}
        <div className="space-y-5">
          {/* 预约基础信息 */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-muted-foreground" /> 预约信息
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <InfoGrid items={[
                { label: "客户", value: appointment.customer.name },
                { label: "手机号", value: appointment.customer.phone },
                {
                  label: "宠物",
                  value: [appointment.pet.name, appointment.pet.breed, appointment.pet.ageText]
                    .filter(Boolean).join(" · "),
                },
                {
                  label: "服务项目",
                  value: `${appointment.serviceItem.name} · ${appointment.serviceItem.durationMinutes} 分钟`,
                },
                { label: "预约开始", value: fmt(appointment.startTime) },
                { label: "预约结束", value: fmt(appointment.endTime) },
                { label: "负责员工", value: appointment.staff?.name ?? "未分配" },
                { label: "备注", value: appointment.remark || "无" },
              ]} />
            </CardContent>
          </Card>

          {/* 履约记录摘要 */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" /> 履约记录
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <InfoGrid items={[
                { label: "到店时间", value: fmt(vr?.checkInAt) },
                { label: "完成时间", value: fmt(vr?.completedAt) },
                { label: "实际服务", value: vr?.actualServiceName || "未填写" },
                {
                  label: "实际金额",
                  value: fmtMoney(vr?.actualAmount ? Number(vr.actualAmount) : Number(appointment.serviceItem.price)),
                },
                { label: "履约员工", value: vr?.staff?.name ?? appointment.staff?.name ?? "未填写" },
                {
                  label: "下次建议到店",
                  value: vr?.nextSuggestedVisitAt
                    ? fmt(vr.nextSuggestedVisitAt, { year: "numeric", month: "2-digit", day: "2-digit" })
                    : "未填写",
                },
              ]} />

              {(vr?.serviceNote || vr?.petConditionNote) && (
                <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
                  {vr?.serviceNote && (
                    <div>
                      <p className="font-medium text-foreground">服务记录</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{vr.serviceNote}</p>
                    </div>
                  )}
                  {vr?.petConditionNote && (
                    <div>
                      <p className="font-medium text-foreground">宠物状态</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{vr.petConditionNote}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右列：状态操作 + 履约表单 */}
        <div className="space-y-5">
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" /> 当前状态
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  当前状态：
                  <span className={`ml-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </p>
                {canEditVisit ? (
                  <p>已可填写或修改右侧履约记录表单。</p>
                ) : (
                  <p>状态进入「服务中」后，将开放履约记录填写。</p>
                )}
                {appointment.cancelReason && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                    取消原因：{appointment.cancelReason}
                  </p>
                )}
              </div>

              {(nextText || canCancel) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {nextText && (
                    <form action={advanceAppointmentStatusAction.bind(null, appointment.id)}>
                      <SubmitButton size="sm" pendingText="处理中...">{nextText}</SubmitButton>
                    </form>
                  )}
                  {canCancel && (
                    <form action={cancelAppointmentAction.bind(null, appointment.id)}>
                      <SubmitButton size="sm" variant="outline" pendingText="处理中...">取消预约</SubmitButton>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {canEditVisit ? (
            <Card className="border shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-muted-foreground" /> 填写履约记录
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <VisitRecordForm
                  action={saveVisitRecordAction.bind(null, appointment.id)}
                  staffOptions={staffOptions}
                  defaultValues={{
                    actualServiceName: vr?.actualServiceName ?? appointment.serviceItem.name,
                    actualAmount: vr?.actualAmount
                      ? Number(vr.actualAmount).toString()
                      : Number(appointment.serviceItem.price).toString(),
                    staffId: vr?.staffId ?? appointment.staffId ?? "",
                    serviceNote: vr?.serviceNote ?? "",
                    petConditionNote: vr?.petConditionNote ?? "",
                    nextSuggestedVisitAt: vr?.nextSuggestedVisitAt
                      ? format(vr.nextSuggestedVisitAt, "yyyy-MM-dd")
                      : "",
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed shadow-none">
              <CardContent className="flex min-h-32 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                状态进入「服务中」后，这里会开放履约记录填写。
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
