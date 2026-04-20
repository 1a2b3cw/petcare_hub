import { z } from "zod";

export const createAppointmentSchema = z.object({
  customerId: z.string().min(1, "请选择客户"),
  petId: z.string().min(1, "请选择宠物"),
  serviceItemId: z.string().min(1, "请选择服务项目"),
  staffId: z.string().optional(),
  scheduledDate: z.string().min(1, "请选择预约日期"),
  startTime: z.string().min(1, "请选择开始时间"),
  endTime: z.string().optional(),
  remark: z.string().max(200, "备注不能超过 200 个字符").optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
