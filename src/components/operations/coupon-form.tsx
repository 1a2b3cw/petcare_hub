import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { couponTypeOptions } from "@/lib/validations/coupon";

type CustomerOption = {
  id: string;
  name: string;
  phone: string;
};

type CouponFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  customers: CustomerOption[];
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

function validUntilDefault() {
  const target = new Date();
  target.setDate(target.getDate() + 30);

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function CouponForm({ action, customers }: CouponFormProps) {
  return (
    <form action={action} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">客户</span>
          <select name="customerId" defaultValue="" className={selectClassName} required>
            <option value="">请选择客户</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} / {customer.phone}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">券名称</span>
          <Input name="title" defaultValue="老客回店券" placeholder="例如：洗护回店立减券" required />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">优惠类型</span>
          <select name="type" defaultValue="CASH" className={selectClassName}>
            {couponTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">优惠值</span>
          <Input name="value" type="number" min="0.1" step="0.1" defaultValue="30" required />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">最低消费门槛</span>
          <Input name="minSpend" type="number" min="0" step="0.1" defaultValue="100" placeholder="可选" />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">失效日期</span>
          <Input name="validUntil" type="date" defaultValue={validUntilDefault()} required />
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">备注</span>
          <Textarea name="note" placeholder="例如：针对 30 天未回店客户发放，鼓励尽快预约。" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText="发券中...">发放优惠券</SubmitButton>
      </div>
    </form>
  );
}
