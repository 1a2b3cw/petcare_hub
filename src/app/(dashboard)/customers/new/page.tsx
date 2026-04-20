import { createCustomerAction } from "@/app/(dashboard)/customers/actions";
import { PageHeader } from "@/components/common/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="新增客户"
        description="客户手机号必须唯一，后续做预约、回访、发券都会围绕客户档案展开。"
      />

      <CustomerForm
        action={createCustomerAction}
        submitText="保存客户"
        pendingText="保存中..."
        cancelHref="/customers"
      />
    </div>
  );
}
