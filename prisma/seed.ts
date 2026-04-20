import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addDays, set } from "date-fns";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("petcare123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@petcarehub.local" },
    update: {
      name: "店长账号",
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
    create: {
      name: "店长账号",
      email: "owner@petcarehub.local",
      passwordHash,
      role: "OWNER",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@petcarehub.local" },
    update: {
      name: "美容师小林",
      passwordHash,
      role: "STAFF",
      isActive: true,
    },
    create: {
      name: "美容师小林",
      email: "staff@petcarehub.local",
      passwordHash,
      role: "STAFF",
    },
  });

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

  const tomorrow = addDays(new Date(), 1);
  const startTime = set(tomorrow, { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
  const endTime = set(tomorrow, { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 });

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
      startTime,
      endTime,
      status: "CONFIRMED",
      remark: "首次用系统录入的演示预约。",
    },
  });

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

  console.log("Seed completed.");
  console.log(`Owner login: ${owner.email} / petcare123`);
  console.log(`Staff login: ${staff.email} / petcare123`);
  console.log(`Demo service created: ${groomingService.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
