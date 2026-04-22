import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="section-header border-b border-slate-200 pb-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">{actions}</div> : null}
    </div>
  );
}
