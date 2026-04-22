"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { storeProfileSchema } from "@/lib/validations/store-profile";

export async function saveStoreProfileAction(formData: FormData) {
  const result = storeProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    businessHours: formData.get("businessHours"),
    description: formData.get("description"),
  });

  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join("；"));
  }

  const { name, phone, address, businessHours, description } = result.data;

  await prisma.storeProfile.upsert({
    where: { id: "default-store" },
    update: {
      name,
      phone: phone ?? null,
      address: address ?? null,
      businessHours: businessHours ?? null,
      description: description ?? null,
    },
    create: {
      id: "default-store",
      name,
      phone: phone ?? null,
      address: address ?? null,
      businessHours: businessHours ?? null,
      description: description ?? null,
    },
  });

  revalidatePath("/settings");
  redirect("/settings?success=saved");
}
