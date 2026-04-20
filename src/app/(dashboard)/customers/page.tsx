import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";

const mockCustomers = [
  { name: "张女士", phone: "13900001111", pets: "奶糕 / 比熊", lastVisit: "2026-04-02" },
  { name: "李先生", phone: "13700002222", pets: "橘子 / 英短", lastVisit: "2026-03-21" },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="客户与宠物"
        description="客户和宠物档案是预约主链路的基础，后续会扩展为详情页和历史履约记录。"
        actions={<Button variant="outline">新增客户</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {mockCustomers.map((customer) => (
          <div key={customer.phone} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{customer.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{customer.phone}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">老客</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">宠物</dt>
                <dd className="text-slate-800">{customer.pets}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">最近到店</dt>
                <dd className="text-slate-800">{customer.lastVisit}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
