"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { customerFormSchema } from "@/lib/validations/customer";
import { petFormSchema } from "@/lib/validations/pet";

function parseFormDataSafe<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join("；"));
  }
  return result.data;
}

function parseCustomerFormData(formData: FormData) {
  return parseFormDataSafe(customerFormSchema, {
    name: formData.get("name"),
    phone: formData.get("phone"),
    wechat: formData.get("wechat"),
    note: formData.get("note"),
  });
}

function parsePetFormData(formData: FormData) {
  return parseFormDataSafe(petFormSchema, {
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

  let customer: { id: string };
  try {
    customer = await prisma.customer.create({
      data: {
        name: values.name,
        phone: values.phone,
        wechat: values.wechat,
        note: values.note,
      },
      select: { id: true },
    });
  } catch (err: unknown) {
    if (isPrismaUniqueError(err)) {
      throw new Error("该手机号已被其他客户占用，请检查后重试。");
    }
    throw err;
  }

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}?success=created`);
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  const values = parseCustomerFormData(formData);

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: values.name,
        phone: values.phone,
        wechat: values.wechat,
        note: values.note,
      },
    });
  } catch (err: unknown) {
    if (isPrismaUniqueError(err)) {
      throw new Error("该手机号已被其他客户占用，请检查后重试。");
    }
    throw err;
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}?success=updated`);
}

export async function createPetAction(customerId: string, formData: FormData) {
  const values = parsePetFormData(formData);

  // 校验 customerId 真实存在，防止误操作
  const customerExists = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });
  if (!customerExists) {
    throw new Error("客户不存在，无法添加宠物。");
  }

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

  // where 同时约束 id + customerId，防止越权修改他人宠物
  const updated = await prisma.pet.updateMany({
    where: { id: petId, customerId },
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

  if (updated.count === 0) {
    throw new Error("宠物不存在或无权修改。");
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}?success=updated`);
}

// Prisma P2002 unique constraint violation
function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
