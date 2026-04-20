import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type CustomerFormValues = {
  name: string;
  phone: string;
  wechat: string;
  note: string;
};

type CustomerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitText: string;
  pendingText: string;
  cancelHref: string;
  defaultValues?: Partial<CustomerFormValues>;
};

const initialValues: CustomerFormValues = {
  name: "",
  phone: "",
  wechat: "",
  note: "",
};

export function CustomerForm({
  action,
  submitText,
  pendingText,
  cancelHref,
  defaultValues,
}: CustomerFormProps) {
  const values = { ...initialValues, ...defaultValues };

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">客户姓名</span>
          <Input name="name" defaultValue={values.name} placeholder="例如：张女士" required />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">手机号</span>
          <Input name="phone" defaultValue={values.phone} placeholder="例如：13800000000" required />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">微信号</span>
          <Input name="wechat" defaultValue={values.wechat} placeholder="可选" />
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">备注</span>
          <Textarea name="note" defaultValue={values.note} placeholder="例如：老客，偏好周末上午预约。" />
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
