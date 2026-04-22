"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  placeholder?: string;
  className?: string;
};

export function SearchInput({ placeholder = "搜索…", className }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // 本地输入值独立管理，不随每次击键触发路由跳转
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");

  // URL 参数外部变化时同步本地值（如浏览器前进/后退）
  useEffect(() => {
    setInputValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const commit = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`.replace(/\?$/, ""), { scroll: false });
    });
  };

  const clear = () => {
    setInputValue("");
    commit("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => commit(inputValue)}
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
          isPending && "animate-pulse",
        )}
        tabIndex={-1}
        aria-label="搜索"
      >
        <Search className="h-4 w-4" />
      </button>

      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(inputValue);
          if (e.key === "Escape") clear();
        }}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />

      {inputValue && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="清除搜索"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
