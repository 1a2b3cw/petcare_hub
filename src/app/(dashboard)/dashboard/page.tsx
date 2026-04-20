import { PageHeader } from "@/components/common/page-header";

const stats = [
  { label: "今日预约", value: "12" },
  { label: "待确认", value: "4" },
  { label: "今日完成", value: "6" },
  { label: "待回访", value: "9" },
];

export default function DashboardPage() {
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
          <h2 className="text-lg font-semibold">当前开发顺序</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li>1. 先完成 Prisma 迁移和种子数据</li>
            <li>2. 再打通服务项目、客户/宠物档案</li>
            <li>3. 最后补预约流转和履约记录</li>
          </ol>
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
