import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border p-10 sm:p-12 rounded-2xl text-center flex flex-col items-center",
        className
      )}
    >
      {icon ? (
        <div className="w-12 h-12 rounded-full bg-cream border border-border flex items-center justify-center text-ink-muted mb-4">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-medium text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-ink-muted max-w-sm">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="h-8 bg-border rounded w-48"></div>
      <div className="h-64 bg-border rounded-2xl w-full"></div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 bg-border rounded-2xl"></div>
      ))}
    </div>
  );
}