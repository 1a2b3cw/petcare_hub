import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { petGenderOptions, petSizeOptions, petTypeOptions } from "@/lib/validations/pet";

export const revalidate = 30;

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

function optionLabel<T extends string>(options: ReadonlyArray<{ label: string; value: T }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      pets: { orderBy: { createdAt: "asc" } },
      appointments: {
        orderBy: { scheduledDate: "desc" },
        take: 5,
        include: {
          pet: { select: { name: true } },
          serviceItem: { select: { name: true } },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={customer.name}
        description={`${customer.phone}${customer.wechat ? ` · 微信 ${customer.wechat}` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/customers">返回列表</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/customers/${customer.id}/edit`}>编辑客户</Link>
            </Button>
            <Button asChild>
              <Link href={`/customers/${customer.id}/pets/new`}>新增宠物</Link>
            </Button>
          </div>
        }
      />

      {customer.note ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">客户备注</p>
          <p className="mt-2 whitespace-pre-wrap">{customer.note}</p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">宠物档案</h2>
          <span className="text-sm text-slate-500">共 {customer.pets.length} 只</span>
        </div>

        {customer.pets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <p>这位客户还没有登记宠物。</p>
            <p className="mt-1 text-sm">
              <Link href={`/customers/${customer.id}/pets/new`} className="text-slate-900 underline">
                去登记一只宠物
              </Link>
              ，才能创建预约。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {customer.pets.map((pet) => (
              <div key={pet.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{pet.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {optionLabel(petTypeOptions, pet.type)}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/customers/${customer.id}/pets/${pet.id}/edit`}>编辑</Link>
                  </Button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div>
                    <dt className="text-slate-500">性别</dt>
                    <dd>{optionLabel(petGenderOptions, pet.gender)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">体型</dt>
                    <dd>{optionLabel(petSizeOptions, pet.size)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">年龄</dt>
                    <dd>{pet.ageText || "未填"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">毛发</dt>
                    <dd className="truncate">{pet.coatCondition || "未填"}</dd>
                  </div>
                </dl>

                {pet.healthNote ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    健康：{pet.healthNote}
                  </p>
                ) : null}
                {pet.temperamentNote ? (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    性格：{pet.temperamentNote}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">最近预约</h2>
          <span className="text-sm text-slate-500">展示最近 5 条</span>
        </div>

        {customer.appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            暂无预约记录。预约模块做完后，这里会自动出现最近的到店履约情况。
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">日期</th>
                  <th className="px-4 py-3">宠物</th>
                  <th className="px-4 py-3">服务</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customer.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-3">
                      {new Intl.DateTimeFormat("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }).format(appointment.scheduledDate)}
                    </td>
                    <td className="px-4 py-3">{appointment.pet.name}</td>
                    <td className="px-4 py-3">{appointment.serviceItem.name}</td>
                    <td className="px-4 py-3">{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
