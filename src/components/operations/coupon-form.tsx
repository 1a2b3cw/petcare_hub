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
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">客户 <span className="text-destructive">*</span></span>
          <select name="customerId" defaultValue="" className={selectClassName} required>
            <option value="">请选择客户</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} / {customer.phone}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">券名称 <span className="text-destructive">*</span></span>
          <Input name="title" defaultValue="老客回店券" placeholder="例如：洗护回店立减券" required />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">优惠类型</span>
          <select name="type" defaultValue="CASH" className={selectClassName}>
            {couponTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">优惠值 <span className="text-destructive">*</span></span>
          <Input name="value" type="number" min="0.1" step="0.1" defaultValue="30" required />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">最低消费门槛</span>
          <Input name="minSpend" type="number" min="0" step="0.1" defaultValue="100" placeholder="可选" />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">失效日期 <span className="text-destructive">*</span></span>
          <Input name="validUntil" type="date" defaultValue={validUntilDefault()} required />
        </label>

        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">备注</span>
          <Textarea name="note" placeholder="例如：针对 30 天未回店客户发放，鼓励尽快预约。" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingText="发券中...">发放优惠券</SubmitButton>
      </div>
    </form>
  );
}
