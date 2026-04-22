import Link from "next/link";
import type { PetGender, PetSize, PetType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { petGenderOptions, petSizeOptions, petTypeOptions } from "@/lib/validations/pet";

type PetFormValues = {
  name: string;
  type: PetType;
  breed: string;
  gender: PetGender;
  ageText: string;
  size: PetSize;
  coatCondition: string;
  healthNote: string;
  temperamentNote: string;
};

type PetFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitText: string;
  pendingText: string;
  cancelHref: string;
  defaultValues?: Partial<PetFormValues>;
};

const initialValues: PetFormValues = {
  name: "",
  type: "DOG",
  breed: "",
  gender: "UNKNOWN",
  ageText: "",
  size: "UNKNOWN",
  coatCondition: "",
  healthNote: "",
  temperamentNote: "",
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function PetForm({ action, submitText, pendingText, cancelHref, defaultValues }: PetFormProps) {
  const values = { ...initialValues, ...defaultValues };

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">宠物名称 <span className="text-destructive">*</span></span>
          <Input name="name" defaultValue={values.name} placeholder="例如：奶糕" required />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">类型</span>
          <select name="type" defaultValue={values.type} className={selectClassName}>
            {petTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">品种</span>
          <Input name="breed" defaultValue={values.breed} placeholder="例如：比熊" />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">性别</span>
          <select name="gender" defaultValue={values.gender} className={selectClassName}>
            {petGenderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">年龄</span>
          <Input name="ageText" defaultValue={values.ageText} placeholder="例如：2岁" />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">体型</span>
          <select name="size" defaultValue={values.size} className={selectClassName}>
            {petSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">毛发情况</span>
          <Input name="coatCondition" defaultValue={values.coatCondition} placeholder="例如：卷毛，需定期修剪" />
        </label>

        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">健康备注</span>
          <Textarea name="healthNote" defaultValue={values.healthNote} placeholder="如有皮肤问题、慢性病等可记录在这里" />
        </label>

        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">性格备注</span>
          <Textarea
            name="temperamentNote"
            defaultValue={values.temperamentNote}
            placeholder="例如：洗澡配合度高"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingText={pendingText}>{submitText}</SubmitButton>
        <Button asChild variant="outline">
          <Link href={cancelHref}>取消</Link>
        </Button>
      </div>
    </form>
  );
}
