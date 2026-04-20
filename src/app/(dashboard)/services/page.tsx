import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { toggleServiceStatusAction } from "@/app/(dashboard)/services/actions";

export const dynamic = "force-dynamic";

function formatPrice(price: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function categoryLabel(category: string) {
  switch (category) {
    case "BATH":
      return "洗护";
    case "GROOMING":
      return "美容";
    case "CARE":
      return "护理";
    default:
      return category;
  }
}

function petScopeLabel(scope: string) {
  switch (scope) {
    case "DOG":
      return "狗狗";
    case "CAT":
      return "猫咪";
    case "ALL":
      return "不限";
    default:
      return scope;
  }
}

export default async function ServicesPage() {
  const services = await prisma.serviceItem.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="服务项目"
        description="先把最适合独立完成的一条业务线打通：真实列表、真实新增、真实编辑和启停。"
        actions={
          <Button asChild>
            <Link href="/services/new">新增服务</Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">服务名称</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">时长</th>
              <th className="px-4 py-3 font-medium">价格</th>
              <th className="px-4 py-3 font-medium">适用宠物</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  还没有服务项目，先新增一条基础洗护服务作为预约模块的数据来源。
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{service.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{service.description || "暂无服务说明"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{categoryLabel(service.category)}</td>
                  <td className="px-4 py-4 text-slate-600">{service.durationMinutes} 分钟</td>
                  <td className="px-4 py-4 text-slate-600">{formatPrice(Number(service.price))}</td>
                  <td className="px-4 py-4 text-slate-600">{petScopeLabel(service.petTypeScope)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        service.isActive
                          ? "rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                          : "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500"
                      }
                    >
                      {service.isActive ? "启用中" : "已停用"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/services/${service.id}/edit`}>编辑</Link>
                      </Button>
                      <form action={toggleServiceStatusAction.bind(null, service.id, !service.isActive)}>
                        <SubmitButton size="sm" variant="ghost" pendingText="处理中...">
                          {service.isActive ? "停用" : "启用"}
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
