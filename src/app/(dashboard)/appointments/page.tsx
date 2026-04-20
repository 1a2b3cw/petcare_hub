"use client";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useAppointmentFilterStore } from "@/stores/appointment-filter.store";
import { appointmentStatusOptions } from "@/types/domain";

const mockAppointments = [
  { no: "APT-20260419-001", customer: "张女士", pet: "奶糕", service: "基础洗护", time: "10:00", status: "CONFIRMED" },
  { no: "APT-20260419-002", customer: "李先生", pet: "橘子", service: "基础洗护", time: "14:00", status: "PENDING" },
];

export default function AppointmentsPage() {
  const { status, setStatus } = useAppointmentFilterStore();

  const filteredAppointments =
    status === "ALL" ? mockAppointments : mockAppointments.filter((item) => item.status === status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="预约管理"
        description="这里先把预约列表、筛选和状态字段预留好，后面接数据库时能无缝替换。"
        actions={<Button>新建预约</Button>}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant={status === "ALL" ? "default" : "outline"} size="sm" onClick={() => setStatus("ALL")}>
          全部
        </Button>
        {appointmentStatusOptions.map((option) => (
          <Button
            key={option.value}
            variant={status === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">预约编号</th>
              <th className="px-4 py-3 font-medium">客户/宠物</th>
              <th className="px-4 py-3 font-medium">服务</th>
              <th className="px-4 py-3 font-medium">时间</th>
              <th className="px-4 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAppointments.map((appointment) => (
              <tr key={appointment.no}>
                <td className="px-4 py-4 font-medium text-slate-900">{appointment.no}</td>
                <td className="px-4 py-4 text-slate-600">
                  {appointment.customer} / {appointment.pet}
                </td>
                <td className="px-4 py-4 text-slate-600">{appointment.service}</td>
                <td className="px-4 py-4 text-slate-600">{appointment.time}</td>
                <td className="px-4 py-4 text-slate-600">{appointment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
