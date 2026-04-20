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
  "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

export function PetForm({ action, submitText, pendingText, cancelHref, defaultValues }: PetFormProps) {
  const values = { ...initialValues, ...defaultValues };

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">宠物名称</span>
          <Input name="name" defaultValue={values.name} placeholder="例如：奶糕" required />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">类型</span>
          <select name="type" defaultValue={values.type} className={selectClassName}>
            {petTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">品种</span>
          <Input name="breed" defaultValue={values.breed} placeholder="例如：比熊" />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">性别</span>
          <select name="gender" defaultValue={values.gender} className={selectClassName}>
            {petGenderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">年龄</span>
          <Input name="ageText" defaultValue={values.ageText} placeholder="例如：2岁" />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">体型</span>
          <select name="size" defaultValue={values.size} className={selectClassName}>
            {petSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">毛发情况</span>
          <Input name="coatCondition" defaultValue={values.coatCondition} placeholder="例如：卷毛，需定期修剪" />
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">健康备注</span>
          <Textarea name="healthNote" defaultValue={values.healthNote} placeholder="如有皮肤问题、慢性病等可记录在这里" />
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">性格备注</span>
          <Textarea
            name="temperamentNote"
            defaultValue={values.temperamentNote}
            placeholder="例如：洗澡配合度高"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText={pendingText}>{submitText}</SubmitButton>
        <Button asChild variant="outline">
          <Link href={cancelHref}>取消</Link>
        </Button>
      </div>
    </form>
  );
}
