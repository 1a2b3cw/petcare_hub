import Link from "next/link";
import { Suspense } from "react";
import { PawPrint, Phone, Plus, Users } from "lucide-react";

import { SearchInput } from "@/components/common/search-input";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

const CUSTOMERS_PAGE_LIMIT = 100;

type CustomersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { wechat: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
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
      <SearchParamToast />
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

      {/* 搜索框 */}
      <Suspense fallback={null}>
        <SearchInput
          placeholder="搜索姓名、手机号、微信号…"
          className="max-w-sm"
        />
      </Suspense>

      {customers.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3">
            <Users className="h-10 w-10 text-muted-foreground/30" />
            {q ? (
              <>
                <p className="text-sm text-muted-foreground">没有找到匹配「{q}」的客户</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/customers">清除搜索</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">还没有客户档案</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/customers/new">新增第一个客户</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {q && (
            <p className="text-sm text-muted-foreground">
              找到 <span className="font-medium text-foreground">{customers.length}</span> 位匹配「{q}」的客户
            </p>
          )}
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
                              <Badge key={pet.id} variant="secondary" className="gap-1 text-xs">
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
        </>
      )}
    </div>
  );
}
