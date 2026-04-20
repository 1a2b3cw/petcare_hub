import { notFound } from "next/navigation";

import { updateServiceAction } from "@/app/(dashboard)/services/actions";
import { PageHeader } from "@/components/common/page-header";
import { ServiceForm } from "@/components/services/service-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditServicePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;

  const service = await prisma.serviceItem.findUnique({
    where: { id },
  });

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="编辑服务"
        description="服务项目不做复杂配置系统，先保证门店最常用的字段能清楚维护。"
      />

      <ServiceForm
        action={updateServiceAction.bind(null, service.id)}
        submitText="保存修改"
        pendingText="保存中..."
        defaultValues={{
          name: service.name,
          category: service.category,
          durationMinutes: service.durationMinutes,
          price: Number(service.price),
          petTypeScope: service.petTypeScope,
          description: service.description ?? "",
        }}
      />
    </div>
  );
}
