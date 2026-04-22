import { z } from "zod";

const petTypeValues = ["DOG", "CAT"] as const;
const petGenderValues = ["MALE", "FEMALE", "UNKNOWN"] as const;
const petSizeValues = ["SMALL", "MEDIUM", "LARGE", "UNKNOWN"] as const;

export const petFormSchema = z.object({
  name: z.string().trim().min(1, "请输入宠物名称").max(50, "宠物名称不能超过 50 个字符"),
  type: z.enum(petTypeValues),
  breed: z
    .string()
    .trim()
    .max(50, "品种不能超过 50 个字符")
    .optional()
    .transform((value) => value || undefined),
  gender: z.enum(petGenderValues),
  ageText: z
    .string()
    .trim()
    .max(20, "年龄描述不能超过 20 个字符")
    .optional()
    .transform((value) => value || undefined),
  size: z.enum(petSizeValues),
  coatCondition: z
    .string()
    .trim()
    .max(100, "毛发情况不能超过 100 个字符")
    .optional()
    .transform((value) => value || undefined),
  healthNote: z
    .string()
    .trim()
    .max(200, "健康备注不能超过 200 个字符")
    .optional()
    .transform((value) => value || undefined),
  temperamentNote: z
    .string()
    .trim()
    .max(200, "性格备注不能超过 200 个字符")
    .optional()
    .transform((value) => value || undefined),
});

export type PetFormInput = z.infer<typeof petFormSchema>;

export const petTypeOptions = [
  { label: "狗狗", value: "DOG" },
  { label: "猫咪", value: "CAT" },
] as const;

export const petGenderOptions = [
  { label: "未知", value: "UNKNOWN" },
  { label: "公", value: "MALE" },
  { label: "母", value: "FEMALE" },
] as const;

export const petSizeOptions = [
  { label: "未知", value: "UNKNOWN" },
  { label: "小型", value: "SMALL" },
  { label: "中型", value: "MEDIUM" },
  { label: "大型", value: "LARGE" },
] as const;
