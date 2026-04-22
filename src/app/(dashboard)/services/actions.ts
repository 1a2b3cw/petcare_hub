"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { serviceFormSchema } from "@/lib/validations/service";

function parseServiceFormData(formData: FormData) {
  const result = serviceFormSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    price: formData.get("price"),
    petTypeScope: formData.get("petTypeScope"),
    description: formData.get("description"),
  });
  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join("；"));
  }
  return result.data;
}

export async function createServiceAction(formData: FormData) {
  const values = parseServiceFormData(formData);

  await prisma.serviceItem.create({
    data: {
      name: values.name,
      category: values.category,
      durationMinutes: values.durationMinutes,
      price: values.price,
      petTypeScope: values.petTypeScope,
      description: values.description,
    },
  });

  revalidatePath("/services");
  redirect("/services?success=created");
}

export async function updateServiceAction(serviceId: string, formData: FormData) {
  const values = parseServiceFormData(formData);

  // 先查确认存在再更新，防止 P2025 静默失败
  const existing = await prisma.serviceItem.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("服务项目不存在，可能已被删除。");
  }

  await prisma.serviceItem.update({
    where: { id: serviceId },
    data: {
      name: values.name,
      category: values.category,
      durationMinutes: values.durationMinutes,
      price: values.price,
      petTypeScope: values.petTypeScope,
      description: values.description,
    },
  });

  revalidatePath("/services");
  redirect("/services?success=updated");
}

export async function toggleServiceStatusAction(serviceId: string, nextStatus: boolean) {
  const existing = await prisma.serviceItem.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.serviceItem.update({
    where: { id: serviceId },
    data: { isActive: nextStatus },
  });

  revalidatePath("/services");
}
