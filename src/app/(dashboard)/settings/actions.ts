"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export async function saveStoreProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const businessHours = String(formData.get("businessHours") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return;

  await prisma.storeProfile.upsert({
    where: { id: "default-store" },
    update: { name, phone: phone || null, address: address || null, businessHours: businessHours || null, description: description || null },
    create: { id: "default-store", name, phone: phone || null, address: address || null, businessHours: businessHours || null, description: description || null },
  });

  revalidatePath("/settings");
  redirect("/settings?success=saved");
}
