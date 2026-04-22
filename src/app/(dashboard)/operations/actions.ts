"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parse } from "date-fns";

import { prisma } from "@/lib/prisma";
import { couponFormSchema } from "@/lib/validations/coupon";

async function revalidateOperationPaths(customerId?: string) {
  revalidatePath("/operations");
  revalidatePath("/dashboard");
  revalidatePath("/customers");

  if (customerId) {
    revalidatePath(`/customers/${customerId}`);
  }
}

function parseCouponFormData(formData: FormData) {
  const result = couponFormSchema.safeParse({
    customerId: formData.get("customerId"),
    title: formData.get("title"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSpend: formData.get("minSpend"),
    validUntil: formData.get("validUntil"),
    note: formData.get("note"),
  });
  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join("；"));
  }
  return result.data;
}

export async function completeFollowUpTaskAction(taskId: string) {
  const task = await prisma.followUpTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      customerId: true,
      status: true,
    },
  });

  if (!task || task.status === "DONE") {
    return;
  }

  await prisma.followUpTask.update({
    where: { id: task.id },
    data: {
      status: "DONE",
      completedAt: new Date(),
    },
  });

  await revalidateOperationPaths(task.customerId);
}

export async function skipFollowUpTaskAction(taskId: string) {
  const task = await prisma.followUpTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      customerId: true,
      status: true,
    },
  });

  if (!task || task.status === "SKIPPED") {
    return;
  }

  await prisma.followUpTask.update({
    where: { id: task.id },
    data: {
      status: "SKIPPED",
      completedAt: new Date(),
    },
  });

  await revalidateOperationPaths(task.customerId);
}

export async function createCouponAction(formData: FormData) {
  const values = parseCouponFormData(formData);

  const customer = await prisma.customer.findUnique({
    where: { id: values.customerId },
    select: { id: true },
  });

  if (!customer) {
    throw new Error("客户不存在，无法发券。");
  }

  const validUntil = parse(values.validUntil, "yyyy-MM-dd", new Date());

  if (Number.isNaN(validUntil.getTime())) {
    throw new Error("优惠券失效日期格式不正确。");
  }

  await prisma.coupon.create({
    data: {
      customerId: customer.id,
      title: values.title,
      type: values.type,
      value: values.value,
      minSpend: values.minSpend ? Number(values.minSpend) : null,
      validFrom: new Date(),
      validUntil,
      note: values.note,
    },
  });

  await revalidateOperationPaths(customer.id);
  redirect("/operations?success=sent");
}

export async function markCouponUsedAction(couponId: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: { id: true, customerId: true, status: true },
  });

  if (!coupon || coupon.status === "USED") {
    return;
  }

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: {
      status: "USED",
    },
  });

  await revalidateOperationPaths(coupon.customerId);
}

export async function markCouponExpiredAction(couponId: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: { id: true, customerId: true, status: true },
  });

  if (!coupon || coupon.status === "EXPIRED") {
    return;
  }

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: {
      status: "EXPIRED",
    },
  });

  await revalidateOperationPaths(coupon.customerId);
}
