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

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ServiceForm({ action, submitText, pendingText, defaultValues }: ServiceFormProps) {
  const values = { ...initialValues, ...defaultValues };

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">服务名称 <span className="text-destructive">*</span></span>
          <Input name="name" placeholder="例如：基础洗护" defaultValue={values.name} required />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">服务分类</span>
          <select name="category" defaultValue={values.category} className={selectClassName}>
            {serviceCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">参考时长（分钟）</span>
          <Input
            name="durationMinutes"
            type="number"
            min={10}
            step={10}
            defaultValue={values.durationMinutes}
            required
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">价格（元）</span>
          <Input name="price" type="number" min={0} step="0.01" defaultValue={values.price} required />
        </label>

        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">适用宠物</span>
          <select name="petTypeScope" defaultValue={values.petTypeScope} className={selectClassName}>
            {servicePetScopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">服务说明</span>
          <Textarea
            name="description"
            placeholder="例如：包含基础洗澡、吹毛、耳道清理。"
            defaultValue={values.description}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingText={pendingText}>{submitText}</SubmitButton>
        <Button asChild variant="outline">
          <Link href="/services">返回列表</Link>
        </Button>
      </div>
    </form>
  );
}
