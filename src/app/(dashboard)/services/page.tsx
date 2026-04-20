import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";

const mockServices = [
  { name: "基础洗护", duration: "60 分钟", price: "¥128", status: "启用中" },
  { name: "精修美容", duration: "120 分钟", price: "¥268", status: "启用中" },
];

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="服务项目"
        description="这里先放服务项目管理骨架，后续接入 Prisma 后直接切成真实列表。"
        actions={<Button>新增服务</Button>}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">服务名称</th>
              <th className="px-4 py-3 font-medium">时长</th>
              <th className="px-4 py-3 font-medium">价格</th>
              <th className="px-4 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockServices.map((service) => (
              <tr key={service.name}>
                <td className="px-4 py-4 font-medium text-slate-900">{service.name}</td>
                <td className="px-4 py-4 text-slate-600">{service.duration}</td>
                <td className="px-4 py-4 text-slate-600">{service.price}</td>
                <td className="px-4 py-4 text-slate-600">{service.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
