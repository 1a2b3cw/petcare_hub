import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

function formatDate(date: Date | null | undefined) {
  if (!date) return "暂无到店记录";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pets: true,
      appointments: {
        where: { status: "COMPLETED" },
        orderBy: { scheduledDate: "desc" },
        take: 1,
        select: { scheduledDate: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="客户与宠物"
        description="客户档案是预约主链路的起点。先把“新增客户 - 登记宠物 - 查看历史”这条线走通。"
        actions={
          <Button asChild>
            <Link href="/customers/new">新增客户</Link>
          </Button>
        }
      />

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <p>还没有客户档案。</p>
          <p className="mt-1 text-sm">先新增一个客户，后面就能给他登记宠物并创建预约。</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {customers.map((customer) => {
            const petsLabel = customer.pets.length
              ? customer.pets.map((pet) => pet.name).join("、")
              : "尚未登记宠物";
            const lastVisit = customer.appointments[0]?.scheduledDate ?? null;

            return (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{customer.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{customer.phone}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {customer.pets.length} 只宠物
                  </span>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">宠物</dt>
                    <dd className="text-slate-800">{petsLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">最近完成服务</dt>
                    <dd className="text-slate-800">{formatDate(lastVisit)}</dd>
                  </div>
                  {customer.note ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">备注</dt>
                      <dd className="line-clamp-1 text-slate-800">{customer.note}</dd>
                    </div>
                  ) : null}
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
