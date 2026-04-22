"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes, endOfDay, format, parse, startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import { appointmentFormSchema, visitRecordFormSchema } from "@/lib/validations/appointment";

function parseAppointmentFormData(formData: FormData) {
  return appointmentFormSchema.parse({
    customerId: formData.get("customerId"),
    petId: formData.get("petId"),
    serviceItemId: formData.get("serviceItemId"),
    staffId: formData.get("staffId"),
    scheduledDate: formData.get("scheduledDate"),
    startTime: formData.get("startTime"),
    remark: formData.get("remark"),
  });
}

function parseVisitRecordFormData(formData: FormData) {
  return visitRecordFormSchema.parse({
    actualServiceName: formData.get("actualServiceName"),
    actualAmount: formData.get("actualAmount"),
    staffId: formData.get("staffId"),
    serviceNote: formData.get("serviceNote"),
    petConditionNote: formData.get("petConditionNote"),
    nextSuggestedVisitAt: formData.get("nextSuggestedVisitAt"),
  });
}

function revalidateAppointmentPaths(customerId: string) {
  revalidatePath("/appointments");
  revalidatePath("/customers");
  revalidatePath("/operations");
  revalidatePath(`/customers/${customerId}`);
}

function revalidateAppointmentDetailPath(appointmentId: string) {
  revalidatePath(`/appointments/${appointmentId}`);
}

async function syncFollowUpTaskFromVisitRecord(input: {
  visitRecordId: string;
  customerId: string;
  petId: string;
  actualServiceName: string;
  nextSuggestedVisitAt?: Date;
}) {
  const { visitRecordId, customerId, petId, actualServiceName, nextSuggestedVisitAt } = input;

  if (!nextSuggestedVisitAt) {
    return;
  }

  const existingTask = await prisma.followUpTask.findFirst({
    where: {
      sourceVisitRecordId: visitRecordId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  const note = `根据「${actualServiceName}」的履约记录，建议在该日期联系客户安排下次到店。`;

  if (existingTask) {
    await prisma.followUpTask.update({
      where: { id: existingTask.id },
      data: {
        customerId,
        petId,
        dueDate: nextSuggestedVisitAt,
        note,
      },
    });
    return;
  }

  await prisma.followUpTask.create({
    data: {
      customerId,
      petId,
      sourceVisitRecordId: visitRecordId,
      dueDate: nextSuggestedVisitAt,
      note,
    },
  });
}

async function buildAppointmentNo(scheduledDate: Date) {
  const prefix = `APT-${format(scheduledDate, "yyyyMMdd")}`;
  const count = await prisma.appointment.count({
    where: {
      scheduledDate: {
        gte: startOfDay(scheduledDate),
        lte: endOfDay(scheduledDate),
      },
    },
  });

  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

export async function createAppointmentAction(formData: FormData) {
  const values = parseAppointmentFormData(formData);

  const [customer, pet, serviceItem, staff] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: values.customerId },
      select: { id: true },
    }),
    prisma.pet.findUnique({
      where: { id: values.petId },
      select: { id: true, customerId: true, type: true },
    }),
    prisma.serviceItem.findUnique({
      where: { id: values.serviceItemId },
      select: { id: true, durationMinutes: true, petTypeScope: true, isActive: true },
    }),
    values.staffId
      ? prisma.user.findUnique({
          where: { id: values.staffId },
          select: { id: true, isActive: true },
        })
      : Promise.resolve(null),
  ]);

  if (!customer) {
    throw new Error("客户不存在，无法创建预约。");
  }

  if (!pet || pet.customerId !== customer.id) {
    throw new Error("所选宠物和客户不匹配。");
  }

  if (!serviceItem || !serviceItem.isActive) {
    throw new Error("服务项目不存在或已停用。");
  }

  if (serviceItem.petTypeScope !== "ALL" && serviceItem.petTypeScope !== pet.type) {
    throw new Error("该服务项目不适用于当前宠物类型。");
  }

  if (values.staffId && (!staff || !staff.isActive)) {
    throw new Error("所选员工不存在或已停用。");
  }

  const scheduledDate = startOfDay(parse(values.scheduledDate, "yyyy-MM-dd", new Date()));
  const startTime = parse(`${values.scheduledDate} ${values.startTime}`, "yyyy-MM-dd HH:mm", new Date());

  if (Number.isNaN(scheduledDate.getTime()) || Number.isNaN(startTime.getTime())) {
    throw new Error("预约时间格式不正确。");
  }

  const endTime = addMinutes(startTime, serviceItem.durationMinutes);
  const appointmentNo = await buildAppointmentNo(scheduledDate);

  await prisma.appointment.create({
    data: {
      appointmentNo,
      customerId: customer.id,
      petId: pet.id,
      serviceItemId: serviceItem.id,
      staffId: values.staffId,
      scheduledDate,
      startTime,
      endTime,
      remark: values.remark,
    },
  });

  revalidateAppointmentPaths(customer.id);
  redirect("/appointments?success=created");
}

export async function advanceAppointmentStatusAction(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      customerId: true,
      status: true,
      staffId: true,
      serviceItem: {
        select: {
          name: true,
          price: true,
        },
      },
      visitRecord: {
        select: {
          id: true,
          actualServiceName: true,
          actualAmount: true,
          checkInAt: true,
          completedAt: true,
          staffId: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("预约不存在。");
  }

  let nextStatus = appointment.status;

  switch (appointment.status) {
    case "PENDING":
      nextStatus = "CONFIRMED";
      break;
    case "CONFIRMED":
      nextStatus = "IN_SERVICE";
      break;
    case "IN_SERVICE":
      nextStatus = "COMPLETED";
      break;
    default:
      return;
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: nextStatus },
  });

  if (nextStatus === "IN_SERVICE") {
    await prisma.visitRecord.upsert({
      where: { appointmentId: appointment.id },
      update: {
        checkInAt: appointment.visitRecord?.checkInAt ?? new Date(),
        actualServiceName: appointment.visitRecord?.actualServiceName || appointment.serviceItem.name,
        actualAmount: appointment.visitRecord?.actualAmount ?? appointment.serviceItem.price,
        staffId: appointment.visitRecord?.staffId ?? appointment.staffId,
      },
      create: {
        appointmentId: appointment.id,
        checkInAt: new Date(),
        actualServiceName: appointment.serviceItem.name,
        actualAmount: appointment.serviceItem.price,
        staffId: appointment.staffId,
      },
    });
  }

  if (nextStatus === "COMPLETED") {
    await prisma.visitRecord.upsert({
      where: { appointmentId: appointment.id },
      update: {
        completedAt: appointment.visitRecord?.completedAt ?? new Date(),
        actualServiceName: appointment.visitRecord?.actualServiceName || appointment.serviceItem.name,
        actualAmount: appointment.visitRecord?.actualAmount ?? appointment.serviceItem.price,
        staffId: appointment.visitRecord?.staffId ?? appointment.staffId,
      },
      create: {
        appointmentId: appointment.id,
        completedAt: new Date(),
        actualServiceName: appointment.serviceItem.name,
        actualAmount: appointment.serviceItem.price,
        staffId: appointment.staffId,
      },
    });
  }

  revalidateAppointmentPaths(appointment.customerId);
  revalidateAppointmentDetailPath(appointment.id);
}

export async function cancelAppointmentAction(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, customerId: true, status: true },
  });

  if (!appointment) {
    throw new Error("预约不存在。");
  }

  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    return;
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "CANCELLED",
      cancelReason: "后台手动取消",
    },
  });

  revalidateAppointmentPaths(appointment.customerId);
  revalidateAppointmentDetailPath(appointment.id);
}

export async function saveVisitRecordAction(appointmentId: string, formData: FormData) {
  const values = parseVisitRecordFormData(formData);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      customerId: true,
      petId: true,
      serviceItem: {
        select: {
          name: true,
          price: true,
        },
      },
      staffId: true,
    },
  });

  if (!appointment) {
    throw new Error("预约不存在。");
  }

  const staff = values.staffId
    ? await prisma.user.findUnique({
        where: { id: values.staffId },
        select: { id: true, isActive: true },
      })
    : null;

  if (values.staffId && (!staff || !staff.isActive)) {
    throw new Error("所选履约员工不存在或已停用。");
  }

  const nextSuggestedVisitAt = values.nextSuggestedVisitAt
    ? parse(values.nextSuggestedVisitAt, "yyyy-MM-dd", new Date())
    : undefined;

  if (values.nextSuggestedVisitAt && Number.isNaN(nextSuggestedVisitAt?.getTime())) {
    throw new Error("下次建议到店日期格式不正确。");
  }

  const visitRecord = await prisma.visitRecord.upsert({
    where: { appointmentId },
    update: {
      actualServiceName: values.actualServiceName,
      actualAmount: values.actualAmount ? Number(values.actualAmount) : null,
      staffId: values.staffId ?? null,
      serviceNote: values.serviceNote,
      petConditionNote: values.petConditionNote,
      nextSuggestedVisitAt,
    },
    create: {
      appointmentId,
      actualServiceName: values.actualServiceName || appointment.serviceItem.name,
      actualAmount: values.actualAmount ? Number(values.actualAmount) : appointment.serviceItem.price,
      staffId: values.staffId ?? appointment.staffId,
      serviceNote: values.serviceNote,
      petConditionNote: values.petConditionNote,
      nextSuggestedVisitAt,
    },
    select: {
      id: true,
      actualServiceName: true,
      nextSuggestedVisitAt: true,
    },
  });

  await syncFollowUpTaskFromVisitRecord({
    visitRecordId: visitRecord.id,
    customerId: appointment.customerId,
    petId: appointment.petId,
    actualServiceName: visitRecord.actualServiceName,
    nextSuggestedVisitAt: visitRecord.nextSuggestedVisitAt ?? undefined,
  });

  revalidateAppointmentPaths(appointment.customerId);
  revalidateAppointmentDetailPath(appointmentId);
  redirect(`/appointments/${appointmentId}?success=saved`);
}
