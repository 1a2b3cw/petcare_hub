"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { serviceFormSchema } from "@/lib/validations/service";

function parseServiceFormData(formData: FormData) {
  return serviceFormSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    price: formData.get("price"),
    petTypeScope: formData.get("petTypeScope"),
    description: formData.get("description"),
  });
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
  redirect("/services");
}

export async function updateServiceAction(serviceId: string, formData: FormData) {
  const values = parseServiceFormData(formData);

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
  redirect("/services");
}

export async function toggleServiceStatusAction(serviceId: string, nextStatus: boolean) {
  await prisma.serviceItem.update({
    where: { id: serviceId },
    data: {
      isActive: nextStatus,
    },
  });

  revalidatePath("/services");
}
