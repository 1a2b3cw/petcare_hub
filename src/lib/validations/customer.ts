import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "请输入客户姓名").max(50, "姓名不能超过 50 个字符"),
  phone: z
    .string()
    .trim()
    .min(6, "请输入有效的手机号")
    .max(20, "手机号长度不合法")
    .regex(/^[0-9+\-\s]+$/, "手机号只能包含数字、加号、减号和空格"),
  wechat: z
    .string()
    .trim()
    .max(50, "微信号不能超过 50 个字符")
    .optional()
    .transform((value) => value || undefined),
  note: z
    .string()
    .trim()
    .max(200, "备注不能超过 200 个字符")
    .optional()
    .transform((value) => value || undefined),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
