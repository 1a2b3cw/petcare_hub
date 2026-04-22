import { notFound } from "next/navigation";

import { updatePetAction } from "@/app/(dashboard)/customers/actions";
import { PageHeader } from "@/components/common/page-header";
import { PetForm } from "@/components/pets/pet-form";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditPetPageProps = {
  params: Promise<{ id: string; petId: string }>;
};

export default async function EditPetPage({ params }: EditPetPageProps) {
  const { id, petId } = await params;

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: { customer: { select: { id: true, name: true } } },
  });

  if (!pet || pet.customerId !== id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`编辑宠物：${pet.name}`}
        description={`所属客户：${pet.customer.name}`}
      />

      <Card className="max-w-2xl border shadow-sm">
        <CardContent className="pt-6">
          <PetForm
            action={updatePetAction.bind(null, id, pet.id)}
            submitText="保存修改"
            pendingText="保存中..."
            cancelHref={`/customers/${id}`}
            defaultValues={{
              name: pet.name,
              type: pet.type,
              breed: pet.breed ?? "",
              gender: pet.gender,
              ageText: pet.ageText ?? "",
              size: pet.size,
              coatCondition: pet.coatCondition ?? "",
              healthNote: pet.healthNote ?? "",
              temperamentNote: pet.temperamentNote ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
