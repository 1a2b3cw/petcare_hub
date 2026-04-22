import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BarChart3, TrendingDown, TrendingUp, Users } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }).format(amount);
}

async function getMonthlyData(monthStart: Date, monthEnd: Date) {
  const [revenue, appointmentCount, newCustomerCount] = await Promise.all([
    prisma.visitRecord.aggregate({
      _sum: { actualAmount: true },
      where: { completedAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.appointment.count({
      where: { status: "COMPLETED", scheduledDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.customer.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
  ]);
  return {
    revenue: Number(revenue._sum.actualAmount ?? 0),
    appointmentCount,
    newCustomerCount,
  };
}

export default async function ReportsPage() {
  const now = new Date();

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "M月", { locale: zhCN }) };
  });

  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [thisMonth, lastMonth, topServices, monthlyTrend, couponStats, customerStats] = await Promise.all([
    getMonthlyData(thisMonthStart, thisMonthEnd),
    getMonthlyData(lastMonthStart, lastMonthEnd),
    prisma.appointment.groupBy({
      by: ["serviceItemId"],
      where: { status: "COMPLETED", scheduledDate: { gte: subMonths(now, 3) } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    Promise.all(months.map((m) => getMonthlyData(m.start, m.end).then((d) => ({ ...d, label: m.label })))),
    prisma.coupon.groupBy({ by: ["status"], _count: { id: true } }),
    Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: { appointments: { some: { status: "COMPLETED", scheduledDate: { gte: subMonths(now, 1) } } } },
      }),
    ]),
  ]);

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

  const revenueGrowth =
    lastMonth.revenue === 0 ? null : ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100;
  const appointmentGrowth =
    lastMonth.appointmentCount === 0
      ? null
      : ((thisMonth.appointmentCount - lastMonth.appointmentCount) / lastMonth.appointmentCount) * 100;

  const couponStatusMap = Object.fromEntries(couponStats.map((s) => [s.status, s._count.id]));
  const [totalCustomers, activeCustomers] = customerStats;
  const retentionRate = totalCustomers === 0 ? 0 : Math.round((activeCustomers / totalCustomers) * 100);

  const maxRevenue = Math.max(...monthlyTrend.map((m) => m.revenue), 1);
  const maxAppointments = Math.max(...monthlyTrend.map((m) => m.appointmentCount), 1);
  const maxNewCustomers = Math.max(...monthlyTrend.map((m) => m.newCustomerCount), 1);

  const statCards = [
    {
      label: "本月收入",
      value: formatCurrency(thisMonth.revenue),
      sub: `上月 ${formatCurrency(lastMonth.revenue)}`,
      growth: revenueGrowth,
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "完成预约",
      value: `${thisMonth.appointmentCount} 单`,
      sub: `上月 ${lastMonth.appointmentCount} 单`,
      growth: appointmentGrowth,
      icon: BarChart3,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "新增客户",
      value: `${thisMonth.newCustomerCount} 人`,
      sub: `上月 ${lastMonth.newCustomerCount} 人`,
      growth: null,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "活跃客户",
      value: `${activeCustomers} / ${totalCustomers}`,
      sub: `30 天留存率 ${retentionRate}%`,
      growth: null,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="经营报表" description="按月汇总收入、预约量和客户数据。" />

      {/* 核心指标 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground truncate">{stat.value}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{stat.sub}</p>
                      {stat.growth !== null && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            stat.growth >= 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {stat.growth >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(Math.round(stat.growth))}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex-none rounded-xl p-2.5 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 趋势图 */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">近 6 个月收入趋势</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {monthlyTrend.map((m) => (
                <div key={m.label} className="flex items-center gap-3 text-sm">
                  <span className="w-8 flex-none text-xs text-muted-foreground">{m.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-5 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="w-20 flex-none text-right text-xs font-medium text-foreground">
                    {m.revenue > 0 ? formatCurrency(m.revenue) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">近 6 个月预约量趋势</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {monthlyTrend.map((m) => (
                <div key={m.label} className="flex items-center gap-3 text-sm">
                  <span className="w-8 flex-none text-xs text-muted-foreground">{m.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-5 rounded-full bg-sky-500 transition-all"
                      style={{ width: `${Math.max((m.appointmentCount / maxAppointments) * 100, m.appointmentCount > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="w-12 flex-none text-right text-xs font-medium text-foreground">
                    {m.appointmentCount > 0 ? `${m.appointmentCount} 单` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热门服务 + 优惠券 */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">近 3 个月热门服务 Top 5</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {topServicesWithName.length === 0 ? (
              <p className="text-sm text-muted-foreground">近 3 个月暂无完成预约数据。</p>
            ) : (
              <div className="space-y-3">
                {topServicesWithName.map((s, idx) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? "bg-amber-100 text-amber-700"
                        : idx === 1 ? "bg-slate-200 text-slate-600"
                        : idx === 2 ? "bg-orange-100 text-orange-700"
                        : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground">¥{s.price}</span>
                    <span className="w-12 text-right text-sm font-semibold text-foreground">{s.count} 单</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">优惠券使用概况</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            {[
              { status: "UNUSED", label: "未使用", className: "border-amber-200 bg-amber-50 text-amber-700" },
              { status: "USED",   label: "已使用", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
              { status: "EXPIRED",label: "已过期", className: "border-border bg-muted text-muted-foreground" },
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${item.className}`}>
                  {item.label}
                </span>
                <span className="font-semibold text-foreground">{couponStatusMap[item.status] ?? 0} 张</span>
              </div>
            ))}

            <div className="mt-1 rounded-lg border bg-muted/30 px-3 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总发放</span>
                <span className="font-semibold">{Object.values(couponStatusMap).reduce((a, b) => a + b, 0)} 张</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-muted-foreground">使用率</span>
                <span className="font-semibold">
                  {(() => {
                    const total = Object.values(couponStatusMap).reduce((a, b) => a + b, 0);
                    const used = couponStatusMap["USED"] ?? 0;
                    return total === 0 ? "—" : `${Math.round((used / total) * 100)}%`;
                  })()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 新客户柱状图 */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">近 6 个月新增客户</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 h-32">
            {monthlyTrend.map((m) => {
              const heightPct = m.newCustomerCount > 0 ? Math.max((m.newCustomerCount / maxNewCustomers) * 100, 8) : 0;
              return (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-foreground h-4">
                    {m.newCustomerCount > 0 ? m.newCustomerCount : ""}
                  </span>
                  <div className="flex w-full items-end" style={{ height: "80px" }}>
                    <div
                      className="w-full rounded-t-md bg-violet-500 transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
