import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-orange-100 text-orange-800",
  active: "bg-green-100 text-green-800",
  past_due: "bg-red-100 text-red-800",
  canceled: "bg-gray-100 text-gray-700",
  pending_authorization: "bg-blue-100 text-blue-800",
  on: "bg-green-100 text-green-800",
  off: "bg-gray-100 text-gray-700",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
        styles[status] || "bg-gray-100 text-gray-700",
        className
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}