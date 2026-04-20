import { notFound } from "next/navigation";

import { updateCustomerAction } from "@/app/(dashboard)/customers/actions";
import { PageHeader } from "@/components/common/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`编辑客户：${customer.name}`}
        description="修改客户基础资料。手机号如果调整，注意要和系统里已有数据保持唯一。"
      />

      <CustomerForm
        action={updateCustomerAction.bind(null, customer.id)}
        submitText="保存修改"
        pendingText="保存中..."
        cancelHref={`/customers/${customer.id}`}
        defaultValues={{
          name: customer.name,
          phone: customer.phone,
          wechat: customer.wechat ?? "",
          note: customer.note ?? "",
        }}
      />
    </div>
  );
}
