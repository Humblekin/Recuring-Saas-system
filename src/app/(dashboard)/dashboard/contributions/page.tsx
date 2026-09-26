import { getContributions } from "@/app/actions/payments";
import { formatCurrencyFromMinor } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DownloadCsv } from "@/components/dashboard/DownloadCsv";
import { WalletIcon } from "@/components/ui/icons";

export default async function ContributionsPage() {
  const { list, summary } = await getContributions();

  const totalCollected = summary
    .filter((s) => s.status === "success")
    .reduce((acc, s) => acc + s.total, 0);
  const successfulCount = summary.find((s) => s.status === "success")?.count || 0;
  const pendingCount = summary.find((s) => s.status === "pending")?.count || 0;
  const failedCount = summary.find((s) => s.status === "failed")?.count || 0;
  const unsettled = summary
    .filter((s) => s.status !== "success")
    .reduce((acc, s) => acc + s.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
            Contributions
          </h2>
          <p className="text-ink-muted mt-1">Every payment received or pending for your organization.</p>
        </div>
        <DownloadCsv
          className="px-5 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm"
          label="Export CSV"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border p-5 rounded-2xl">
          <div className="text-sm text-ink-muted mb-1">Total collected</div>
          <div className="text-2xl font-medium">{formatCurrencyFromMinor(totalCollected, "GHS")}</div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-2xl">
          <div className="text-sm text-ink-muted mb-1">Successful</div>
          <div className="text-2xl font-medium">{successfulCount}</div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-2xl">
          <div className="text-sm text-ink-muted mb-1">Unsettled (pending/failed)</div>
          <div className="text-2xl font-medium">{formatCurrencyFromMinor(unsettled, "GHS")}</div>
          <div className="text-xs text-ink-muted mt-0.5">{pendingCount} pending · {failedCount} failed</div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<WalletIcon size={20} />}
          title="No contributions yet"
          description="Share a payment link to receive your first contribution."
        />
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-cream">
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Reference</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Supporter</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Reason</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((payment) => (
                  <tr key={payment.id} className="hover:bg-cream/50 transition-colors">
                    <td className="p-4 text-sm font-mono text-[13px] text-ink-muted">{payment.reference}</td>
                    <td className="p-4 text-sm">
                      <div className="font-medium text-ink">{payment.supporter?.name || "Anonymous"}</div>
                      <div className="text-xs text-ink-muted">{payment.supporter?.email}</div>
                    </td>
                    <td className="p-4 text-sm text-ink-muted">
                      {payment.campaign?.title || payment.paymentLink?.name || "General"}
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {formatCurrencyFromMinor(payment.amount, payment.currency || "GHS")}
                    </td>
                    <td className="p-4 text-sm text-ink-muted">{payment.isRecurring ? "Recurring" : "One-time"}</td>
                    <td className="p-4 text-sm">
                      <StatusBadge status={payment.status} />
                      {payment.status === "failed" &&
                        (payment.metadata as { mtnReason?: string } | undefined)?.mtnReason && (
                          <p
                            className="text-xs text-ink-muted mt-1 max-w-[280px] truncate"
                            title={(payment.metadata as { mtnReason: string }).mtnReason}
                          >
                            {(payment.metadata as { mtnReason: string }).mtnReason}
                          </p>
                        )}
                    </td>
                    <td className="p-4 text-sm text-ink-muted whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}