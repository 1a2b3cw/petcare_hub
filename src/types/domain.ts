export type AppSidebarItem = {
  href: string;
  label: string;
  description: string;
};

export const appointmentStatusOptions = [
  { label: "待确认", value: "PENDING" },
  { label: "已确认", value: "CONFIRMED" },
  { label: "服务中", value: "IN_SERVICE" },
  { label: "已完成", value: "COMPLETED" },
  { label: "已取消", value: "CANCELLED" },
] as const;
