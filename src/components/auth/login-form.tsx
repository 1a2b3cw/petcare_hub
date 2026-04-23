"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  callbackUrl: string;
};

const DEMO_ACCOUNT = {
  label: "店长",
  email: "owner@petcarehub.local",
  password: "petcare123",
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const submitEmail = String(formData.get("email") ?? "");
    const submitPassword = String(formData.get("password") ?? "");

    setErrorMessage("");

    const result = await signIn("credentials", {
      email: submitEmail,
      password: submitPassword,
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

  const [isDemoLoading, setIsDemoLoading] = useState(false);

  async function handleDemoLogin() {
    setIsDemoLoading(true);
    setErrorMessage("");

    const result = await signIn("credentials", {
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setErrorMessage("演示账号登录失败，请稍后再试。");
      setIsDemoLoading(false);
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
      <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <div>
          <p className="font-medium text-emerald-800">演示账号</p>
          <p className="mt-0.5 text-emerald-700">
            {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
          </p>
        </div>
        <Button
          type="button"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isDemoLoading || isPending}
          onClick={handleDemoLogin}
        >
          {isDemoLoading ? "登录中..." : "演示账号一键登录"}
        </Button>
      </div>



      <label className="block space-y-2 text-sm text-slate-700">
        <span className="font-medium">邮箱</span>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="请输入邮箱"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>


      <label className="block space-y-2 text-sm text-slate-700">
        <span className="font-medium">密码</span>
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="请输入密码"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
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
