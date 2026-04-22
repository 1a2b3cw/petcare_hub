import { PageHeader } from "@/components/common/page-header";
import { ServiceForm } from "@/components/services/service-form";
import { createServiceAction } from "@/app/(dashboard)/services/actions";
import { Card, CardContent } from "@/components/ui/card";

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="新增服务"
        description="先把服务项目做成可维护的数据源，后面的预约创建和履约记录都会依赖这里。"
      />

      <Card className="max-w-2xl border shadow-sm">
        <CardContent className="pt-6">
          <ServiceForm action={createServiceAction} submitText="保存服务" pendingText="保存中..." />
        </CardContent>
      </Card>
    </div>
  );
}
