import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  aside,
  className,
}: PageHeaderProps) {
  const hasAside = Boolean(aside);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-100 bg-[radial-gradient(90%_120%_at_10%_0%,rgba(14,165,164,0.18),transparent_70%),radial-gradient(100%_100%_at_90%_0%,rgba(56,189,248,0.16),transparent_60%),linear-gradient(180deg,#ffffff,#eff6ff)] shadow-sm",
        className
      )}
    >
      <div className="absolute -right-20 -top-20 h-22 w-52 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="absolute -left-10 top-20 h-32 w-48 rounded-full bg-sky-200/30 blur-3xl" />
      <div
        className={cn(
          "relative grid gap-6 p-6 md:p-8",
          hasAside && "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]"
        )}
      >
        <div className="space-y-4">
          {eyebrow ? (
            typeof eyebrow === "string" ? (
              <Badge variant="secondary" className="w-fit bg-slate-900 text-white">
                {eyebrow}
              </Badge>
            ) : (
              <div className="flex flex-wrap items-center gap-2">{eyebrow}</div>
            )
          ) : null}
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
            {description ? <p className="max-w-2xl text-sm text-slate-600">{description}</p> : null}
          </div>
          {actions ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
              {actions}
            </div>
          ) : null}
          {meta ? <div className="flex flex-wrap gap-2 text-xs text-slate-600">{meta}</div> : null}
        </div>
        {aside ? (
          <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
