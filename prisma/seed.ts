import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addDays, set, subDays, subMonths } from "date-fns";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function makeDateTime(baseDate: Date, hour: number, minute = 0) {
  return set(baseDate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
}

async function main() {
  const passwordHash = await bcrypt.hash("petcare123", 10);

  // ── 用户 ──────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where: { email: "owner@petcarehub.local" },
    update: { name: "店长账号", passwordHash, role: "OWNER", isActive: true },
    create: { name: "店长账号", email: "owner@petcarehub.local", passwordHash, role: "OWNER" },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@petcarehub.local" },
    update: { name: "美容师小林", passwordHash, role: "STAFF", isActive: true },
    create: { name: "美容师小林", email: "staff@petcarehub.local", passwordHash, role: "STAFF" },
  });

  // ── 门店信息 ──────────────────────────────────────────
  await prisma.storeProfile.upsert({
    where: { id: "default-store" },
    update: {
      name: "宠物洗护演示门店",
      phone: "13800138000",
      address: "上海市浦东新区演示路 88 号",
      businessHours: "09:00-20:00",
      description: "用于作品集演示的单门店后台数据。",
    },
    create: {
      id: "default-store",
      name: "宠物洗护演示门店",
      phone: "13800138000",
      address: "上海市浦东新区演示路 88 号",
      businessHours: "09:00-20:00",
      description: "用于作品集演示的单门店后台数据。",
    },
  });

  // ── 服务项目 ──────────────────────────────────────────
  const bathService = await prisma.serviceItem.upsert({
    where: { id: "service-bath-basic" },
    update: {},
    create: {
      id: "service-bath-basic",
      name: "基础洗护",
      category: "BATH",
      durationMinutes: 60,
      price: 128,
      petTypeScope: "ALL",
      description: "适合常规到店洗护场景。",
      isActive: true,
    },
  });

  const groomingService = await prisma.serviceItem.upsert({
    where: { id: "service-grooming-premium" },
    update: {},
    create: {
      id: "service-grooming-premium",
      name: "精修美容",
      category: "GROOMING",
      durationMinutes: 120,
      price: 268,
      petTypeScope: "DOG",
      description: "包含造型修剪与基础护理。",
      isActive: true,
    },
  });

  const careService = await prisma.serviceItem.upsert({
    where: { id: "service-care-spa" },
    update: {},
    create: {
      id: "service-care-spa",
      name: "SPA 深层护理",
      category: "CARE",
      durationMinutes: 90,
      price: 198,
      petTypeScope: "ALL",
      description: "深层清洁毛囊，适合换季护理。",
      isActive: true,
    },
  });

  // ── 客户 & 宠物 ──────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { phone: "13900001111" },
    update: {},
    create: {
      name: "张女士",
      phone: "13900001111",
      wechat: "zhangpet",
      note: "老客，偏好周末上午预约。",
    },
  });

  const pet = await prisma.pet.upsert({
    where: { id: "pet-milk" },
    update: {},
    create: {
      id: "pet-milk",
      customerId: customer.id,
      name: "奶糕",
      type: "DOG",
      breed: "比熊",
      gender: "FEMALE",
      ageText: "2岁",
      size: "SMALL",
      coatCondition: "卷毛，需定期修剪",
      temperamentNote: "洗澡配合度高",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { phone: "13900002222" },
    update: {},
    create: {
      name: "李先生",
      phone: "13900002222",
      wechat: "lipet88",
      note: "工作日白天方便。",
    },
  });

  const pet2 = await prisma.pet.upsert({
    where: { id: "pet-cola" },
    update: {},
    create: {
      id: "pet-cola",
      customerId: customer2.id,
      name: "可乐",
      type: "DOG",
      breed: "金毛",
      gender: "MALE",
      ageText: "3岁",
      size: "LARGE",
      temperamentNote: "活泼好动，需要两人配合洗浴",
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { phone: "13900003333" },
    update: {},
    create: {
      name: "王女士",
      phone: "13900003333",
      note: "猫咪较胆小，操作需轻柔。",
    },
  });

  const pet3 = await prisma.pet.upsert({
    where: { id: "pet-mochi" },
    update: {},
    create: {
      id: "pet-mochi",
      customerId: customer3.id,
      name: "麻薯",
      type: "CAT",
      breed: "英短",
      gender: "FEMALE",
      ageText: "1岁半",
      size: "MEDIUM",
      temperamentNote: "胆小，需要独立洗浴间",
    },
  });

  // ── 历史已完成预约（近 3 个月，用于报表数据）────────────
  const historicalAppointments: Array<{
    id: string;
    apptNo: string;
    customerId: string;
    petId: string;
    serviceItemId: string;
    serviceName: string;
    price: number;
    daysAgo: number;
    hour: number;
  }> = [
    // 本月
    { id: "appt-h01", apptNo: "APT-H01", customerId: customer.id, petId: pet.id, serviceItemId: bathService.id, serviceName: "基础洗护", price: 128, daysAgo: 3, hour: 10 },
    { id: "appt-h02", apptNo: "APT-H02", customerId: customer2.id, petId: pet2.id, serviceItemId: groomingService.id, serviceName: "精修美容", price: 268, daysAgo: 5, hour: 14 },
    { id: "appt-h03", apptNo: "APT-H03", customerId: customer3.id, petId: pet3.id, serviceItemId: careService.id, serviceName: "SPA 深层护理", price: 198, daysAgo: 8, hour: 11 },
    { id: "appt-h04", apptNo: "APT-H04", customerId: customer.id, petId: pet.id, serviceItemId: groomingService.id, serviceName: "精修美容", price: 268, daysAgo: 12, hour: 9 },
    { id: "appt-h05", apptNo: "APT-H05", customerId: customer2.id, petId: pet2.id, serviceItemId: bathService.id, serviceName: "基础洗护", price: 128, daysAgo: 15, hour: 15 },
    { id: "appt-h06", apptNo: "APT-H06", customerId: customer3.id, petId: pet3.id, serviceItemId: bathService.id, serviceName: "基础洗护", price: 128, daysAgo: 20, hour: 10 },
    // 上月
    { id: "appt-h07", apptNo: "APT-H07", customerId: customer.id, petId: pet.id, serviceItemId: bathService.id, serviceName: "基础洗护", price: 128, daysAgo: 35, hour: 10 },
    { id: "appt-h08", apptNo: "APT-H08", customerId: customer2.id, petId: pet2.id, serviceItemId: careService.id, serviceName: "SPA 深层护理", price: 198, daysAgo: 38, hour: 14 },
    { id: "appt-h09", apptNo: "APT-H09", customerId: customer3.id, petId: pet3.id, serviceItemId: groomingService.id, serviceName: "精修美容", price: 268, daysAgo: 42, hour: 11 },
    { id: "appt-h10", apptNo: "APT-H10", customerId: customer.id, petId: pet.id, serviceItemId: careService.id, serviceName: "SPA 深层护理", price: 198, daysAgo: 50, hour: 9 },
    { id: "appt-h11", apptNo: "APT-H11", customerId: customer2.id, petId: pet2.id, serviceItemId: bathService.id, serviceName: "基础洗护", price: 128, daysAgo: 55, hour: 15 },
    // 两个月前
    { id: "appt-h12", apptNo: "APT-H12", customerId: customer.id, petId: pet.id, serviceItemId: bathService.id, serviceName: "基础洗护", price: 128, daysAgo: 65, hour: 10 },
    { id: "appt-h13", apptNo: "APT-H13", customerId: customer3.id, petId: pet3.id, serviceItemId: bathService.id, serviceName: "基础洗护", price: 128, daysAgo: 70, hour: 11 },
    { id: "appt-h14", apptNo: "APT-H14", customerId: customer2.id, petId: pet2.id, serviceItemId: groomingService.id, serviceName: "精修美容", price: 268, daysAgo: 78, hour: 14 },
    { id: "appt-h15", apptNo: "APT-H15", customerId: customer.id, petId: pet.id, serviceItemId: groomingService.id, serviceName: "精修美容", price: 268, daysAgo: 85, hour: 9 },
  ];

  for (const h of historicalAppointments) {
    const scheduledDate = subDays(new Date(), h.daysAgo);
    const startTime = makeDateTime(scheduledDate, h.hour);
    const endTime = makeDateTime(scheduledDate, h.hour + 1, 30);
    const completedAt = makeDateTime(scheduledDate, h.hour + 1, 20);

    const appt = await prisma.appointment.upsert({
      where: { appointmentNo: h.apptNo },
      update: {},
      create: {
        id: h.id,
        appointmentNo: h.apptNo,
        customerId: h.customerId,
        petId: h.petId,
        serviceItemId: h.serviceItemId,
        staffId: staff.id,
        scheduledDate: set(scheduledDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }),
        startTime,
        endTime,
        status: "COMPLETED",
      },
    });

    await prisma.visitRecord.upsert({
      where: { appointmentId: appt.id },
      update: {},
      create: {
        appointmentId: appt.id,
        actualServiceName: h.serviceName,
        actualAmount: h.price,
        staffId: staff.id,
        checkInAt: startTime,
        completedAt,
        serviceNote: "服务正常完成。",
        nextSuggestedVisitAt: addDays(scheduledDate, 30),
      },
    });
  }

  // ── 明日待确认预约（演示用）────────────────────────────
  const tomorrow = addDays(new Date(), 1);
  await prisma.appointment.upsert({
    where: { appointmentNo: "APT-20260419-001" },
    update: {},
    create: {
      appointmentNo: "APT-20260419-001",
      customerId: customer.id,
      petId: pet.id,
      serviceItemId: bathService.id,
      staffId: staff.id,
      scheduledDate: set(tomorrow, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }),
      startTime: makeDateTime(tomorrow, 10),
      endTime: makeDateTime(tomorrow, 11),
      status: "CONFIRMED",
      remark: "首次用系统录入的演示预约。",
    },
  });

  // ── 优惠券 ────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { id: "coupon-demo-001" },
    update: {},
    create: {
      id: "coupon-demo-001",
      customerId: customer.id,
      title: "老客回店立减券",
      type: "CASH",
      value: 30,
      minSpend: 100,
      status: "UNUSED",
      validFrom: new Date(),
      validUntil: addDays(new Date(), 30),
      note: "手动发券演示数据",
    },
  });

  await prisma.coupon.upsert({
    where: { id: "coupon-demo-002" },
    update: {},
    create: {
      id: "coupon-demo-002",
      customerId: customer2.id,
      title: "新客首次折扣券",
      type: "DISCOUNT",
      value: 0.88,
      minSpend: 150,
      status: "UNUSED",
      validFrom: subMonths(new Date(), 1),
      validUntil: addDays(new Date(), 15),
    },
  });

  // ── 回访任务 ──────────────────────────────────────────
  await prisma.followUpTask.upsert({
    where: { id: "followup-demo-001" },
    update: {},
    create: {
      id: "followup-demo-001",
      customerId: customer.id,
      petId: pet.id,
      dueDate: addDays(new Date(), 25),
      status: "PENDING",
      note: "提醒客户下次洗护时间。",
    },
  });

  await prisma.followUpTask.upsert({
    where: { id: "followup-demo-002" },
    update: {},
    create: {
      id: "followup-demo-002",
      customerId: customer3.id,
      petId: pet3.id,
      dueDate: addDays(new Date(), 7),
      status: "PENDING",
      note: "猫咪毛发护理到期，建议联系预约。",
    },
  });

  console.log("✅ Seed completed.");
  console.log(`   Owner: ${owner.email} / petcare123`);
  console.log(`   Staff: ${staff.email} / petcare123`);
  console.log(`   Historical appointments: ${historicalAppointments.length} with VisitRecords`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
