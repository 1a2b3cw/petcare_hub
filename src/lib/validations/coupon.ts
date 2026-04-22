import { z } from "zod";

export const couponFormSchema = z.object({
  customerId: z.string().trim().min(1, "请选择客户"),
  title: z.string().trim().min(1, "请输入优惠券标题").max(50, "优惠券标题不能超过 50 个字符"),
  type: z.enum(["CASH", "DISCOUNT"]),
  value: z.coerce.number().positive("优惠值必须大于 0"),
  minSpend: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || !Number.isNaN(Number(value)), "门槛金额必须是数字"),
  validUntil: z.string().trim().min(1, "请选择失效日期"),
  note: z
    .string()
    .trim()
    .max(200, "备注不能超过 200 个字符")
    .optional()
    .transform((value) => value || undefined),
});

export type CouponFormInput = z.infer<typeof couponFormSchema>;

export const couponTypeOptions = [
  { label: "立减券", value: "CASH" },
  { label: "折扣券", value: "DISCOUNT" },
] as const;
