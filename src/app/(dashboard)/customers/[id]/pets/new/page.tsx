import { notFound } from "next/navigation";

import { createPetAction } from "@/app/(dashboard)/customers/actions";
import { PageHeader } from "@/components/common/page-header";
import { PetForm } from "@/components/pets/pet-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NewPetPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewPetPage({ params }: NewPetPageProps) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`为 ${customer.name} 新增宠物`}
        description="至少填写名称和类型即可。品种、体型等信息越完整，后续服务推荐会越准。"
      />

      <PetForm
        action={createPetAction.bind(null, customer.id)}
        submitText="保存宠物"
        pendingText="保存中..."
        cancelHref={`/customers/${customer.id}`}
      />
    </div>
  );
}
