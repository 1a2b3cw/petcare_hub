"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
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

  const q = searchParams.get("q") ?? "";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
          isPending && "animate-pulse",
        )}
      />
      <Input
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {q && (
        <button
          type="button"
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
