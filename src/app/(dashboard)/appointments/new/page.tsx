import { createAppointmentAction } from "@/app/(dashboard)/appointments/actions";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/common/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage() {
  const [customers, services, staffOptions] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        pets: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    }),
    prisma.serviceItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        petTypeScope: true,
        price: true,
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="新建预约"
        description="把客户、宠物、服务和时间串起来，先完成一条可真正落库的预约主链路。"
      />

      <AppointmentForm
        action={createAppointmentAction}
        customers={customers}
        services={services.map((service) => ({
          ...service,
          price: Number(service.price),
        }))}
        staffOptions={staffOptions}
        cancelHref="/appointments"
      />
    </div>
  );
}
