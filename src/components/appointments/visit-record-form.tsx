import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type StaffOption = {
  id: string;
  name: string;
};

type VisitRecordFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  staffOptions: StaffOption[];
  defaultValues: {
    actualServiceName: string;
    actualAmount: string;
    staffId: string;
    serviceNote: string;
    petConditionNote: string;
    nextSuggestedVisitAt: string;
  };
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

export function VisitRecordForm({ action, staffOptions, defaultValues }: VisitRecordFormProps) {
  return (
    <form action={action} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">实际服务名称</span>
          <Input name="actualServiceName" defaultValue={defaultValues.actualServiceName} required />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">实际金额</span>
          <Input
            name="actualAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues.actualAmount}
            placeholder="例如：128"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">履约员工</span>
          <select name="staffId" defaultValue={defaultValues.staffId} className={selectClassName}>
            <option value="">暂不指定</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">下次建议到店</span>
          <Input name="nextSuggestedVisitAt" type="date" defaultValue={defaultValues.nextSuggestedVisitAt} />
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">服务记录</span>
          <Textarea
            name="serviceNote"
            defaultValue={defaultValues.serviceNote}
            placeholder="例如：洗护正常完成，修剪了脚底毛和眼周杂毛。"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">宠物状态备注</span>
          <Textarea
            name="petConditionNote"
            defaultValue={defaultValues.petConditionNote}
            placeholder="例如：耳道较干净，皮肤轻微发红，建议观察。"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText="保存中...">保存履约记录</SubmitButton>
      </div>
    </form>
  );
}
