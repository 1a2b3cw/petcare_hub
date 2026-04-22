"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setErrorMessage("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setErrorMessage("账号或密码不正确，请重新输入。");
      return;
    }

    startTransition(() => {
      router.push(result.url ?? callbackUrl);
      router.refresh();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="mt-6 space-y-5"
    >
      <label className="block space-y-2 text-sm text-slate-700">
        <span className="font-medium">邮箱</span>
        <Input name="email" type="email" autoComplete="email" placeholder="请输入邮箱" required />
      </label>

      <label className="block space-y-2 text-sm text-slate-700">
        <span className="font-medium">密码</span>
        <Input name="password" type="password" autoComplete="current-password" placeholder="请输入密码" required />
      </label>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "登录中..." : "登录进入后台"}
        </Button>
      </div>
    </form>
  );
}
