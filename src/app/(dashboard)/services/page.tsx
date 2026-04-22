import Link from "next/link";
import { Plus, Scissors } from "lucide-react";

import { toggleServiceStatusAction } from "@/app/(dashboard)/services/actions";
import { PageHeader } from "@/components/common/page-header";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

function formatPrice(price: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }).format(price);
}

const categoryLabel: Record<string, string> = { BATH: "洗护", GROOMING: "美容", CARE: "护理" };
const petScopeLabel: Record<string, string> = { DOG: "狗狗", CAT: "猫咪", ALL: "不限" };

export default async function ServicesPage() {
  const services = await prisma.serviceItem.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <SearchParamToast />
      <PageHeader
        title="服务项目"
        actions={
          <Button asChild size="sm">
            <Link href="/services/new">
              <Plus className="h-4 w-4" /> 新增服务
            </Link>
          </Button>
        }
      />

      <Card className="border shadow-sm">
        {services.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <Scissors className="h-8 w-8 opacity-30" />
            <p>还没有服务项目</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/services/new">新增第一个服务</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* 移动端卡片列表 */}
            <div className="divide-y md:hidden">
              {services.map((s) => (
                <div key={s.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{s.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{categoryLabel[s.category] ?? s.category}</span>
                        <span>·</span>
                        <span className="font-medium text-foreground">{formatPrice(Number(s.price))}</span>
                        <span>·</span>
                        <span>{s.durationMinutes} 分钟</span>
                        <span>·</span>
                        <span>{petScopeLabel[s.petTypeScope] ?? s.petTypeScope}</span>
                      </div>
                      {s.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{s.description}</p>
                      )}
                    </div>
                    <Badge
                      variant={s.isActive ? "default" : "secondary"}
                      className={`flex-none text-xs ${s.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : ""}`}
                    >
                      {s.isActive ? "启用中" : "已停用"}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex gap-1.5">
                    <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                      <Link href={`/services/${s.id}/edit`}>编辑</Link>
                    </Button>
                    <form action={toggleServiceStatusAction.bind(null, s.id, !s.isActive)}>
                      <SubmitButton size="sm" variant="ghost" className="h-7 px-2.5 text-xs" pendingText="...">
                        {s.isActive ? "停用" : "启用"}
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            {/* 桌面端表格 */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>服务名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>适用</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{s.name}</p>
                        {s.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabel[s.category] ?? s.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.durationMinutes} 分钟</TableCell>
                      <TableCell className="text-sm font-medium">{formatPrice(Number(s.price))}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{petScopeLabel[s.petTypeScope] ?? s.petTypeScope}</TableCell>
                      <TableCell>
                        <Badge
                          variant={s.isActive ? "default" : "secondary"}
                          className={s.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : ""}
                        >
                          {s.isActive ? "启用中" : "已停用"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                            <Link href={`/services/${s.id}/edit`}>编辑</Link>
                          </Button>
                          <form action={toggleServiceStatusAction.bind(null, s.id, !s.isActive)}>
                            <SubmitButton size="sm" variant="ghost" className="h-7 px-2.5 text-xs" pendingText="...">
                              {s.isActive ? "停用" : "启用"}
                            </SubmitButton>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
