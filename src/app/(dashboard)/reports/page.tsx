import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";

import { PageHeader } from "@/components/common/page-header";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(date: Date) {
  return format(date, "M月", { locale: zhCN });
}

async function getMonthlyData(monthStart: Date, monthEnd: Date) {
  const [revenue, appointmentCount, newCustomerCount] = await Promise.all([
    prisma.visitRecord.aggregate({
      _sum: { actualAmount: true },
      where: {
        completedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
        scheduledDate: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.customer.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  return {
    revenue: Number(revenue._sum.actualAmount ?? 0),
    appointmentCount,
    newCustomerCount,
  };
}

export default async function ReportsPage() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // 近 6 个月的月份列表（从旧到新）
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: formatMonth(d) };
  });

  const [thisMonth, lastMonth, topServices, monthlyTrend, couponStats, customerStats] = await Promise.all([
    getMonthlyData(thisMonthStart, thisMonthEnd),
    getMonthlyData(lastMonthStart, lastMonthEnd),

    // 热门服务：按完成预约数排名 Top 5
    prisma.appointment.groupBy({
      by: ["serviceItemId"],
      where: {
        status: "COMPLETED",
        scheduledDate: { gte: subMonths(now, 3) },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),

    // 近 6 个月趋势
    Promise.all(
      months.map((m) => getMonthlyData(m.start, m.end).then((data) => ({ ...data, label: m.label }))),
    ),

    // 优惠券使用统计
    prisma.coupon.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // 客户总数 & 30 天内活跃（有完成预约）
    Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: {
          appointments: {
            some: {
              status: "COMPLETED",
              scheduledDate: { gte: subMonths(now, 1) },
            },
          },
        },
      }),
    ]),
  ]);

  // 补全服务名称
  const serviceIds = topServices.map((s) => s.serviceItemId);
  const serviceNames = await prisma.serviceItem.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, price: true },
  });
  const serviceNameMap = Object.fromEntries(serviceNames.map((s) => [s.id, s]));

  const topServicesWithName = topServices.map((s) => ({
    name: serviceNameMap[s.serviceItemId]?.name ?? "未知服务",
    price: Number(serviceNameMap[s.serviceItemId]?.price ?? 0),
    count: s._count.id,
  }));

  // 本月 vs 上月对比
  const revenueGrowth =
    lastMonth.revenue === 0
      ? null
      : ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100;

  const appointmentGrowth =
    lastMonth.appointmentCount === 0
      ? null
      : ((thisMonth.appointmentCount - lastMonth.appointmentCount) / lastMonth.appointmentCount) * 100;

  // 优惠券状态映射
  const couponStatusMap = Object.fromEntries(couponStats.map((s) => [s.status, s._count.id]));
  const [totalCustomers, activeCustomers] = customerStats;
  const retentionRate = totalCustomers === 0 ? 0 : Math.round((activeCustomers / totalCustomers) * 100);

  // 趋势图：找最大值用于百分比渲染
  const maxRevenue = Math.max(...monthlyTrend.map((m) => m.revenue), 1);
  const maxAppointments = Math.max(...monthlyTrend.map((m) => m.appointmentCount), 1);

  return (
    <div className="space-y-8">
      <PageHeader
        title="经营报表"
        description="按月汇总收入、预约量和客户数据，帮你看清门店整体经营趋势。"
      />

      {/* 本月核心指标 */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">本月核心指标</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="本月收入"
            value={formatCurrency(thisMonth.revenue)}
            sub={lastMonth.revenue > 0 ? `上月 ${formatCurrency(lastMonth.revenue)}` : "上月暂无数据"}
            growth={revenueGrowth}
          />
          <StatCard
            label="完成预约"
            value={`${thisMonth.appointmentCount} 单`}
            sub={`上月 ${lastMonth.appointmentCount} 单`}
            growth={appointmentGrowth}
          />
          <StatCard
            label="新增客户"
            value={`${thisMonth.newCustomerCount} 人`}
            sub={`上月 ${lastMonth.newCustomerCount} 人`}
          />
          <StatCard
            label="活跃客户"
            value={`${activeCustomers} / ${totalCustomers}`}
            sub={`30天内有完成预约，留存率 ${retentionRate}%`}
          />
        </div>
      </section>

      {/* 近6月趋势 */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">近 6 个月收入趋势</h2>
          <div className="space-y-3">
            {monthlyTrend.map((m) => (
              <div key={m.label} className="flex items-center gap-3 text-sm">
                <span className="w-8 flex-none text-slate-500">{m.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-5 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="w-20 flex-none text-right font-medium text-slate-700">
                  {m.revenue > 0 ? formatCurrency(m.revenue) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">近 6 个月预约量趋势</h2>
          <div className="space-y-3">
            {monthlyTrend.map((m) => (
              <div key={m.label} className="flex items-center gap-3 text-sm">
                <span className="w-8 flex-none text-slate-500">{m.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-5 rounded-full bg-sky-500 transition-all"
                    style={{
                      width: `${Math.max((m.appointmentCount / maxAppointments) * 100, m.appointmentCount > 0 ? 2 : 0)}%`,
                    }}
                  />
                </div>
                <span className="w-12 flex-none text-right font-medium text-slate-700">
                  {m.appointmentCount > 0 ? `${m.appointmentCount} 单` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务热度 + 优惠券 */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">近 3 个月热门服务 Top 5</h2>
          {topServicesWithName.length === 0 ? (
            <p className="text-sm text-slate-500">近 3 个月暂无完成预约数据。</p>
          ) : (
            <div className="space-y-3">
              {topServicesWithName.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                      idx === 0
                        ? "bg-amber-100 text-amber-700"
                        : idx === 1
                          ? "bg-slate-200 text-slate-600"
                          : idx === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-slate-800">{s.name}</span>
                  <span className="text-slate-500">¥{s.price}</span>
                  <span className="w-12 text-right font-medium text-slate-900">{s.count} 单</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">优惠券使用概况</h2>
          <div className="space-y-3">
            {[
              { status: "UNUSED", label: "未使用", color: "bg-sky-100 text-sky-700" },
              { status: "USED", label: "已使用", color: "bg-emerald-100 text-emerald-700" },
              { status: "EXPIRED", label: "已过期", color: "bg-slate-100 text-slate-500" },
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.color}`}>{item.label}</span>
                <span className="font-semibold text-slate-900">{couponStatusMap[item.status] ?? 0} 张</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>总发放</span>
              <span className="font-semibold text-slate-900">
                {Object.values(couponStatusMap).reduce((a, b) => a + b, 0)} 张
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>使用率</span>
              <span className="font-semibold text-slate-900">
                {(() => {
                  const total = Object.values(couponStatusMap).reduce((a, b) => a + b, 0);
                  const used = couponStatusMap["USED"] ?? 0;
                  return total === 0 ? "—" : `${Math.round((used / total) * 100)}%`;
                })()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 月度新增客户趋势 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-base font-semibold text-slate-900">近 6 个月新增客户</h2>
        <div className="flex items-end gap-3">
          {monthlyTrend.map((m) => {
            const maxNewCustomers = Math.max(...monthlyTrend.map((x) => x.newCustomerCount), 1);
            const heightPct = Math.max((m.newCustomerCount / maxNewCustomers) * 100, m.newCustomerCount > 0 ? 8 : 0);
            return (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-700">
                  {m.newCustomerCount > 0 ? m.newCustomerCount : ""}
                </span>
                <div className="w-full rounded-t-lg bg-violet-500" style={{ height: `${heightPct * 0.8}px` }} />
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  growth?: number | null;
};

function StatCard({ label, value, sub, growth }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xs text-slate-500">{sub}</p>
        {growth !== null && growth !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              growth >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {growth >= 0 ? "↑" : "↓"} {Math.abs(Math.round(growth))}%
          </span>
        )}
      </div>
    </div>
  );
}
