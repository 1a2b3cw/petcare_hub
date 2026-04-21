"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

async function revalidateOperationPaths(customerId?: string) {
  revalidatePath("/operations");
  revalidatePath("/dashboard");
  revalidatePath("/customers");

  if (customerId) {
    revalidatePath(`/customers/${customerId}`);
  }
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
