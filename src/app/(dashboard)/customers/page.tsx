import Link from "next/link";
import { PawPrint, Phone, Plus, Users } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

function formatDate(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

const CUSTOMERS_PAGE_LIMIT = 100;

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: CUSTOMERS_PAGE_LIMIT,
    include: {
      pets: { select: { id: true, name: true, type: true } },
      appointments: {
        where: { status: "COMPLETED" },
        orderBy: { scheduledDate: "desc" },
        take: 1,
        select: { scheduledDate: true },
      },
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="客户宠物"
        actions={
          <Button asChild size="sm">
            <Link href="/customers/new">
              <Plus className="h-4 w-4" /> 新增客户
            </Link>
          </Button>
        }
      />

      {customers.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3">
            <Users className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">还没有客户档案</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/customers/new">新增第一个客户</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => {
            const lastVisit = customer.appointments[0]?.scheduledDate ?? null;
            return (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="h-full border shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {customer.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{customer.name}</p>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      {customer.pets.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {customer.pets.slice(0, 2).map((pet) => (
                            <Badge key={pet.id} variant="secondary" className="text-xs gap-1">
                              <PawPrint className="h-2.5 w-2.5" />
                              {pet.name}
                            </Badge>
                          ))}
                          {customer.pets.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{customer.pets.length - 2}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                      {lastVisit ? (
                        <span>最近到店：{formatDate(lastVisit)}</span>
                      ) : (
                        <span>暂无到店记录</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
