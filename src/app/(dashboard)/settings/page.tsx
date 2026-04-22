import { Building2, Clock, MapPin, Phone, Store } from "lucide-react";

import { saveStoreProfileAction } from "@/app/(dashboard)/settings/actions";
import { PageHeader } from "@/components/common/page-header";
import { SearchParamToast } from "@/components/common/search-param-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function SettingsPage() {
  const profile = await prisma.storeProfile.findUnique({ where: { id: "default-store" } });

  return (
    <div className="space-y-6">
      <SearchParamToast />
      <PageHeader
        title="门店设置"
        description="管理门店基础信息，这里的数据会作为作品集的演示背景使用。"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 左：编辑表单 */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-muted-foreground" />
              门店资料
            </CardTitle>
            <CardDescription>修改后点击保存即时生效</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={saveStoreProfileAction} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="name">
                  门店名称 <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="例：毛茸茸宠物洗护"
                  defaultValue={profile?.name ?? ""}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="phone">
                  联系电话
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="例：13800138000"
                  defaultValue={profile?.phone ?? ""}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="address">
                  门店地址
                </label>
                <Input
                  id="address"
                  name="address"
                  placeholder="例：上海市浦东新区演示路 88 号"
                  defaultValue={profile?.address ?? ""}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="businessHours">
                  营业时间
                </label>
                <Input
                  id="businessHours"
                  name="businessHours"
                  placeholder="例：09:00–20:00"
                  defaultValue={profile?.businessHours ?? ""}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="description">
                  门店简介
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="简短描述门店特色或服务范围…"
                  defaultValue={profile?.description ?? ""}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <SubmitButton className="w-full" pendingText="保存中…">
                保存设置
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        {/* 右：当前信息预览 */}
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base">当前信息</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {profile ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Building2 className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                    <span className="font-medium text-foreground">{profile.name}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone className="h-4 w-4 flex-none" />
                      {profile.phone}
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-start gap-2.5 text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 flex-none" />
                      {profile.address}
                    </div>
                  )}
                  {profile.businessHours && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-none" />
                      {profile.businessHours}
                    </div>
                  )}
                  {profile.description && (
                    <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2.5 text-muted-foreground">
                      {profile.description}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">还没有保存过门店信息，先填写左侧表单。</p>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">演示账号</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { role: "店长", email: "owner@petcarehub.local" },
                { role: "店员", email: "staff@petcarehub.local" },
              ].map((acc) => (
                <div key={acc.role} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-muted-foreground">{acc.role}</span>
                  <code className="text-xs font-medium text-foreground">{acc.email}</code>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">密码</span>
                <code className="text-xs font-medium text-foreground">petcare123</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
