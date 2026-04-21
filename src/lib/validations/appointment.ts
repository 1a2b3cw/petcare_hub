import { z } from "zod";

export const appointmentFormSchema = z.object({
  customerId: z.string().trim().min(1, "请选择客户"),
  petId: z.string().trim().min(1, "请选择宠物"),
  serviceItemId: z.string().trim().min(1, "请选择服务项目"),
  staffId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  scheduledDate: z.string().trim().min(1, "请选择预约日期"),
  startTime: z.string().trim().min(1, "请选择开始时间"),
  remark: z
    .string()
    .trim()
    .max(200, "备注不能超过 200 个字符")
    .optional()
    .transform((value) => value || undefined),
});

export const createAppointmentSchema = appointmentFormSchema;

export const visitRecordFormSchema = z.object({
  actualServiceName: z.string().trim().min(1, "请填写实际服务名称").max(50, "服务名称不能超过 50 个字符"),
  actualAmount: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || !Number.isNaN(Number(value)), "实际金额必须是数字"),
  staffId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  serviceNote: z
    .string()
    .trim()
    .max(300, "服务记录不能超过 300 个字符")
    .optional()
    .transform((value) => value || undefined),
  petConditionNote: z
    .string()
    .trim()
    .max(300, "宠物状态备注不能超过 300 个字符")
    .optional()
    .transform((value) => value || undefined),
  nextSuggestedVisitAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

export type AppointmentFormInput = z.infer<typeof appointmentFormSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type VisitRecordFormInput = z.infer<typeof visitRecordFormSchema>;
