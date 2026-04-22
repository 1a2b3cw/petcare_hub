"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PetType, ServicePetScope } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type AppointmentCustomer = {
  id: string;
  name: string;
  phone: string;
  pets: Array<{
    id: string;
    name: string;
    type: PetType;
  }>;
};

type AppointmentService = {
  id: string;
  name: string;
  durationMinutes: number;
  petTypeScope: ServicePetScope;
  price: number;
};

type AppointmentStaff = {
  id: string;
  name: string;
};

type AppointmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  customers: AppointmentCustomer[];
  services: AppointmentService[];
  staffOptions: AppointmentStaff[];
  cancelHref: string;
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function petTypeLabel(type: PetType) {
  return type === "DOG" ? "狗狗" : "猫咪";
}

export function AppointmentForm({ action, customers, services, staffOptions, cancelHref }: AppointmentFormProps) {
  const [customerId, setCustomerId] = useState("");
  const [petId, setPetId] = useState("");
  const [serviceItemId, setServiceItemId] = useState("");

  const currentCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customerId, customers],
  );

  const customerPets = currentCustomer?.pets ?? [];
  const effectivePetId = customerPets.some((pet) => pet.id === petId) ? petId : "";
  const selectedPet = customerPets.find((pet) => pet.id === effectivePetId) ?? null;

  const availableServices = useMemo(() => {
    if (!selectedPet) {
      return [];
    }

    return services.filter((service) => service.petTypeScope === "ALL" || service.petTypeScope === selectedPet.type);
  }, [selectedPet, services]);

  const effectiveServiceItemId = availableServices.some((service) => service.id === serviceItemId) ? serviceItemId : "";
  const selectedService = availableServices.find((service) => service.id === effectiveServiceItemId) ?? null;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">客户 <span className="text-destructive">*</span></span>
          <select
            name="customerId"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className={selectClassName}
            required
          >
            <option value="">请选择客户</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} / {customer.phone}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">宠物 <span className="text-destructive">*</span></span>
          <select
            name="petId"
            value={effectivePetId}
            onChange={(event) => setPetId(event.target.value)}
            className={selectClassName}
            disabled={!customerId || customerPets.length === 0}
            required
          >
            <option value="">{customerId ? "请选择宠物" : "先选择客户"}</option>
            {customerPets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} / {petTypeLabel(pet.type)}
              </option>
            ))}
          </select>
          {customerId && customerPets.length === 0 ? (
            <p className="text-xs text-amber-600">这个客户还没有登记宠物，请先去客户详情页补档案。</p>
          ) : null}
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">服务项目 <span className="text-destructive">*</span></span>
          <select
            name="serviceItemId"
            value={effectiveServiceItemId}
            onChange={(event) => setServiceItemId(event.target.value)}
            className={selectClassName}
            disabled={!selectedPet || availableServices.length === 0}
            required
          >
            <option value="">{selectedPet ? "请选择服务项目" : "先选择宠物"}</option>
            {availableServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} / {service.durationMinutes} 分钟 / {service.price} 元
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">安排员工</span>
          <select name="staffId" defaultValue="" className={selectClassName}>
            <option value="">暂不指定</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">预约日期 <span className="text-destructive">*</span></span>
          <Input name="scheduledDate" type="date" defaultValue={todayString()} required />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">开始时间 <span className="text-destructive">*</span></span>
          <Input name="startTime" type="time" defaultValue="10:00" required />
        </label>

        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground">预约备注</span>
          <Textarea
            name="remark"
            placeholder="例如：客户希望尽量安排上午，完成后顺手修一下脚底毛。"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        {selectedService ? (
          <p>
            已选服务预计耗时 {selectedService.durationMinutes} 分钟，价格 {selectedService.price} 元。提交后系统会自动计算结束时间。
          </p>
        ) : (
          <p>先选定客户、宠物和服务，系统会自动帮你推算预约结束时间。</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingText="创建中...">保存预约</SubmitButton>
        <Button asChild variant="outline">
          <Link href={cancelHref}>取消</Link>
        </Button>
      </div>
    </form>
  );
}
