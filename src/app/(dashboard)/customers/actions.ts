"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { customerFormSchema } from "@/lib/validations/customer";
import { petFormSchema } from "@/lib/validations/pet";

function parseCustomerFormData(formData: FormData) {
  return customerFormSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    wechat: formData.get("wechat"),
    note: formData.get("note"),
  });
}

function parsePetFormData(formData: FormData) {
  return petFormSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    breed: formData.get("breed"),
    gender: formData.get("gender"),
    ageText: formData.get("ageText"),
    size: formData.get("size"),
    coatCondition: formData.get("coatCondition"),
    healthNote: formData.get("healthNote"),
    temperamentNote: formData.get("temperamentNote"),
  });
}

export async function createCustomerAction(formData: FormData) {
  const values = parseCustomerFormData(formData);

  const customer = await prisma.customer.create({
    data: {
      name: values.name,
      phone: values.phone,
      wechat: values.wechat,
      note: values.note,
    },
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}?success=created`);
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  const values = parseCustomerFormData(formData);

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: values.name,
      phone: values.phone,
      wechat: values.wechat,
      note: values.note,
    },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}?success=updated`);
}

export async function createPetAction(customerId: string, formData: FormData) {
  const values = parsePetFormData(formData);

  await prisma.pet.create({
    data: {
      customerId,
      name: values.name,
      type: values.type,
      breed: values.breed,
      gender: values.gender,
      ageText: values.ageText,
      size: values.size,
      coatCondition: values.coatCondition,
      healthNote: values.healthNote,
      temperamentNote: values.temperamentNote,
    },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}?success=created`);
}

export async function updatePetAction(customerId: string, petId: string, formData: FormData) {
  const values = parsePetFormData(formData);

  await prisma.pet.update({
    where: { id: petId },
    data: {
      name: values.name,
      type: values.type,
      breed: values.breed,
      gender: values.gender,
      ageText: values.ageText,
      size: values.size,
      coatCondition: values.coatCondition,
      healthNote: values.healthNote,
      temperamentNote: values.temperamentNote,
    },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}?success=updated`);
}
