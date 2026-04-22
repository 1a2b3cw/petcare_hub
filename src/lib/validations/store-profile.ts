import { z } from "zod";

export const storeProfileSchema = z.object({
  name: z.string().trim().min(1, "门店名称不能为空").max(50, "门店名称不能超过 50 个字符"),
  phone: z
    .string()
    .trim()
    .max(20, "电话号码不能超过 20 个字符")
    .optional()
    .transform((v) => v || undefined),
  address: z
    .string()
    .trim()
    .max(200, "地址不能超过 200 个字符")
    .optional()
    .transform((v) => v || undefined),
  businessHours: z
    .string()
    .trim()
    .max(100, "营业时间不能超过 100 个字符")
    .optional()
    .transform((v) => v || undefined),
  description: z
    .string()
    .trim()
    .max(500, "简介不能超过 500 个字符")
    .optional()
    .transform((v) => v || undefined),
});

export type StoreProfileInput = z.infer<typeof storeProfileSchema>;
