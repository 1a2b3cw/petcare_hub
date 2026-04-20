import { z } from "zod";

const serviceCategoryValues = ["BATH", "GROOMING", "CARE"] as const;
const servicePetScopeValues = ["DOG", "CAT", "ALL"] as const;

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "请输入服务名称").max(50, "服务名称不能超过 50 个字符"),
  category: z.enum(serviceCategoryValues),
  durationMinutes: z.coerce.number().int().min(10, "服务时长至少 10 分钟").max(480, "服务时长不能超过 480 分钟"),
  price: z.coerce.number().min(0, "价格不能小于 0").max(9999, "价格不能超过 9999"),
  petTypeScope: z.enum(servicePetScopeValues),
  description: z
    .string()
    .trim()
    .max(200, "服务说明不能超过 200 个字符")
    .optional()
    .transform((value) => value || undefined),
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;

export const serviceCategoryOptions = [
  { label: "洗护", value: "BATH" },
  { label: "美容", value: "GROOMING" },
  { label: "护理", value: "CARE" },
] as const;

export const servicePetScopeOptions = [
  { label: "不限", value: "ALL" },
  { label: "狗狗", value: "DOG" },
  { label: "猫咪", value: "CAT" },
] as const;
