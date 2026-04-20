import Link from "next/link";
import type { ServiceCategory, ServicePetScope } from "@prisma/client";

import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { serviceCategoryOptions, servicePetScopeOptions } from "@/lib/validations/service";

type ServiceFormValues = {
  name: string;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  petTypeScope: ServicePetScope;
  description: string;
};

type ServiceFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitText: string;
  pendingText: string;
  defaultValues?: Partial<ServiceFormValues>;
};

const initialValues: ServiceFormValues = {
  name: "",
  category: "BATH",
  durationMinutes: 60,
  price: 0,
  petTypeScope: "ALL",
  description: "",
};

export function ServiceForm({ action, submitText, pendingText, defaultValues }: ServiceFormProps) {
  const values = { ...initialValues, ...defaultValues };

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">服务名称</span>
          <Input name="name" placeholder="例如：基础洗护" defaultValue={values.name} required />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">服务分类</span>
          <select
            name="category"
            defaultValue={values.category}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {serviceCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">参考时长（分钟）</span>
          <Input
            name="durationMinutes"
            type="number"
            min={10}
            step={10}
            defaultValue={values.durationMinutes}
            required
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">价格（元）</span>
          <Input name="price" type="number" min={0} step="0.01" defaultValue={values.price} required />
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">适用宠物</span>
          <select
            name="petTypeScope"
            defaultValue={values.petTypeScope}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {servicePetScopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">服务说明</span>
          <Textarea
            name="description"
            placeholder="例如：包含基础洗澡、吹毛、耳道清理。"
            defaultValue={values.description}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText={pendingText}>{submitText}</SubmitButton>
        <Button asChild variant="outline">
          <Link href="/services">返回列表</Link>
        </Button>
      </div>
    </form>
  );
}
