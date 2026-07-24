import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  valueClassName?: string;
};

export function StatCard({
  label,
  value,
  hint,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "mt-1 text-2xl font-bold tracking-tight sm:text-3xl",
          valueClassName
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
